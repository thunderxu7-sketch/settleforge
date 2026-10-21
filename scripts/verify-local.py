#!/usr/bin/env python3
"""Run strict, fully local acceptance in disposable PostgreSQL/Core containers."""
import datetime as dt
import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import time
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def available_port(value):
    if not value.isdecimal() or not 1024 <= int(value) <= 65535:
        raise RuntimeError("acceptance port must be an integer between 1024 and 65535")
    with socket.socket() as connection:
        connection.bind(("127.0.0.1", int(value)))
    return value


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")
    path.chmod(0o600)


def main():
    go = os.environ.get("GO", "go")
    for tool in (go, "docker", "python3", "softhsm2-util", "cc", "rg"):
        if not shutil.which(tool):
            raise RuntimeError(f"missing local dependency: {tool}")
    pg_port = available_port(os.environ.get("SETTLEFORGE_CHECK_PG_PORT", "55433"))
    btc_port = available_port(os.environ.get("SETTLEFORGE_CHECK_BTC_PORT", "18543"))
    if pg_port == btc_port:
        raise RuntimeError("PostgreSQL and Bitcoin acceptance ports must differ")
    run_id = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + uuid.uuid4().hex[:8]
    folder = ROOT / ".local/acceptance" / run_id
    folder.mkdir(parents=True, mode=0o700)
    compose = ["docker", "compose", "-p", "settleforge-check-" + run_id.lower()]
    env = os.environ.copy()
    env.update({"PG_PORT": pg_port, "BITCOIN_RPC_PORT": btc_port, "TEST_DATABASE_URL": f"postgres://settleforge:local-development-only@127.0.0.1:{pg_port}/settleforge?sslmode=disable", "TEST_BITCOIN_RPC_URL": f"http://127.0.0.1:{btc_port}", "SOFTHSM_LAB_DIR": str(folder / "softhsm")})
    env.pop("TEST_SIGNER_MODE", None)
    env.pop("TEST_MPC_DIR", None)
    report = {"run_id": run_id, "started_at": now(), "status": "running", "cloud_resources_created": False, "cloud_cost_usd": "0", "commit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(), "working_tree_dirty": bool(subprocess.check_output(["git", "status", "--porcelain"], cwd=ROOT, text=True).strip()), "scopes": {"ledger": "real local PostgreSQL", "bitcoin": "real local Bitcoin Core regtest", "mpc": "actual in-process 2-of-3 threshold protocol", "hsm": "SoftHSM software PKCS11 token", "tee": "local test CA/COSE policy verification; no hardware attestation"}, "checks": []}

    def run(name, command, extra=None, required_tests=(), timeout=900):
        print(f"START {name}", flush=True)
        log_path = folder / (name + ".log")
        started = time.monotonic()
        record = {"name": name, "status": "running", "log": str(log_path)}
        report["checks"].append(record)
        try:
            with log_path.open("w") as log:
                log_path.chmod(0o600)
                process = subprocess.Popen(command, cwd=ROOT, env=dict(env, **(extra or {})), stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
                try:
                    code = process.wait(timeout=timeout)
                except BaseException:
                    if process.poll() is None:
                        os.killpg(process.pid, signal.SIGTERM)
                        try:
                            process.wait(timeout=5)
                        except subprocess.TimeoutExpired:
                            os.killpg(process.pid, signal.SIGKILL)
                            process.wait()
                    raise
            if code:
                raise RuntimeError(f"{name} exited {code}; inspect {log_path}")
            if required_tests:
                passed, skipped = set(), set()
                for line in log_path.read_text().splitlines():
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if event.get("Test") and event.get("Action") == "pass":
                        passed.add(event["Test"])
                    if event.get("Test") and event.get("Action") == "skip":
                        skipped.add(event["Test"])
                missing = set(required_tests) - passed
                if missing or skipped:
                    raise RuntimeError(f"{name}: required tests missing={sorted(missing)}, skipped={sorted(skipped)}")
                record.update({"passed_tests": sorted(passed), "skipped_tests": []})
            record["status"] = "passed"
            print(f"PASS  {name}", flush=True)
        except BaseException:
            record["status"] = "failed"
            raise
        finally:
            record["seconds"] = round(time.monotonic() - started, 2)
            write_json(folder / "report.json", report)

    attempted_compose = False
    failure = None
    try:
        attempted_compose = True
        run("containers", compose + ["up", "-d", "--wait"], timeout=180)
        run("softhsm-init", ["bash", "scripts/setup-softhsm.sh"])
        token = json.loads((folder / "softhsm/runtime.json").read_text())
        env.update({"SOFTHSM2_CONF": token["config"], "TEST_PKCS11_MODULE": token["module"], "TEST_PKCS11_PIN": "98765432"})
        run("go-vet", [go, "vet", "./..."])
        core_test = "TestBitcoinCoreRegtestDepositWithdrawSweepReorg"
        run("core-and-security", [go, "test", "-json", "-race", "-count=1", "./..."], required_tests=(core_test, "TestConcurrentWithdrawalsCannotOverspend", "TestUnknownBroadcastRestartAndExactlyOnceSettlement", "TestPKCS11SoftHSMRealSignatureAndNonExtractable", "TestNitroCOSETrustFreshnessPCRBindingReplay", "TestIndependentSignerApprovalBindingsTamperingAndDurableReplay", "TestRFQSignedQuotesFeesAndSourceTimeout", "TestRFQSettlementApprovalsAndReplay", "TestRFQConcurrentAcceptCannotOverspend", "TestRFQExpiryCancellationAndRecovery", "TestRFQPreflightLimitsAndReview", "TestRFQSettlementRollsBackBothAssets", "TestRFQHTTPQuoteConfirmApproveSettle"))
        mpc_dir = str(folder / "mpc")
        run("mpc-dkg-and-sign", [go, "run", "./cmd/mpclab", "--generate", "--dir", mpc_dir], timeout=1080)
        run("mpc-bitcoin", [go, "test", "-json", "-race", "-count=1", "./internal/service", "-run", "^" + core_test + "$"], extra={"TEST_SIGNER_MODE": "mpc", "TEST_MPC_DIR": mpc_dir}, required_tests=(core_test,))
        run("pkcs11-bitcoin", [go, "test", "-json", "-race", "-count=1", "./internal/service", "-run", "^" + core_test + "$"], extra={"TEST_SIGNER_MODE": "pkcs11"}, required_tests=(core_test,))
        report["status"] = "passed"
    except BaseException as error:
        report["status"] = "failed"
        report["error"] = str(error) or type(error).__name__
        failure = error
    finally:
        if attempted_compose:
            try:
                # The UUID project and volumes were created only for this run.
                run("cleanup", compose + ["down", "--volumes", "--remove-orphans"], timeout=120)
            except BaseException as error:
                report["status"] = "failed"
                report["cleanup_error"] = str(error)
                failure = failure or error
        report["finished_at"] = now()
        write_json(folder / "report.json", report)
        write_json(ROOT / ".local/verification-latest.json", report)
    print(f"{report['status'].upper()}: {folder / 'report.json'}", flush=True)
    if failure:
        raise RuntimeError(report.get("error", report.get("cleanup_error"))) from failure


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
