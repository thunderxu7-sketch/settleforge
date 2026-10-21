#!/usr/bin/env python3
"""HTTP acceptance for the explicitly simulated TRON adapter; never real funds."""
import json
import subprocess
import time
import uuid
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
config = dict(line.split("=", 1) for line in (ROOT / ".local/dev.env").read_text().splitlines() if line and not line.startswith("#"))
base = "http://127.0.0.1:8080"

def api(method, path, body=None, key=None):
    headers = {"Authorization": "Bearer " + config["ADMIN_TOKEN"], "Content-Type": "application/json"}
    if key:
        headers["Idempotency-Key"] = key
    request = Request(base + path, data=None if body is None else json.dumps(body).encode(), method=method, headers=headers)
    with urlopen(request, timeout=15) as response:
        return json.load(response)

def wait_state(wid, states):
    for _ in range(100):
        result = api("GET", "/v1/withdrawals/" + wid)
        if result["state"] in states:
            return result
        time.sleep(0.1)
    raise RuntimeError("transaction did not reach " + str(states))

def approve(wid):
    for actor in ("operator-a", "operator-b"):
        subprocess.run([str(ROOT / "bin/settleforge"), "approve", "--id", wid, "--actor", actor], cwd=ROOT, check=True, capture_output=True)

def main():
    status = api("GET", "/v1/status")
    assert status["networks"]["tron-nile"] == "simulated", "demo requires the explicit simulator"
    user = api("POST", "/v1/users", {"external_ref": "http-demo-" + str(uuid.uuid4())})
    deposit = api("POST", "/v1/wallets", {"user_id": user["id"], "network": "tron-nile", "purpose": "deposit"})
    treasury = api("POST", "/v1/wallets", {"network": "tron-nile", "purpose": "treasury"})
    api("POST", "/v1/dev/capital", {"wallet_id": treasury["id"], "asset": "tron-nile/TRX", "amount": "1000000000", "reference": str(uuid.uuid4())})
    credit = {"network": "tron-nile", "txid": "demo-" + str(uuid.uuid4()), "index": 0, "block_hash": "simulated-block", "height": 1, "wallet_id": deposit["id"], "asset": "tron-nile/TRX", "amount": "100000000", "confirmed": True}
    api("POST", "/v1/dev/deposits", credit)
    api("POST", "/v1/dev/deposits", credit)
    intent = {"user_id": user["id"], "wallet_id": treasury["id"], "network": "tron-nile", "asset": "tron-nile/TRX", "destination": "TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL", "amount": "25000000", "fee_cap": "10", "expires_at": int(time.time()) + 3600}
    key = str(uuid.uuid4())
    withdrawal = api("POST", "/v1/withdrawals", intent, key)
    replay = api("POST", "/v1/withdrawals", intent, key)
    assert replay["id"] == withdrawal["id"]
    api("POST", "/v1/dev/broadcast-timeout", {})
    approve(withdrawal["id"])
    unknown = wait_state(withdrawal["id"], {"broadcast_unknown"})
    api("POST", "/v1/dev/mine", {})
    confirmed = wait_state(withdrawal["id"], {"confirmed"})
    assert unknown["txid"] == confirmed["txid"]
    sweep_intent = dict(intent, wallet_id=deposit["id"], destination=treasury["address"], amount="90000000")
    sweep = api("POST", "/v1/sweeps", sweep_intent, str(uuid.uuid4()))
    approve(sweep["id"])
    wait_state(sweep["id"], {"broadcast"})
    api("POST", "/v1/dev/mine", {})
    swept = wait_state(sweep["id"], {"confirmed"})
    balances = api("GET", "/v1/users/" + user["id"] + "/balances")
    trx = next(b for b in balances if b["asset"] == "tron-nile/TRX")
    assert (trx["available"], trx["frozen"]) == ("75000000", "0"), trx
    reconciliation = api("GET", "/v1/reconciliation")
    assert all(row["difference"] == "0" for row in reconciliation), reconciliation
    report = {"mode": "simulated TRON HTTP acceptance", "deposit_dedup": True, "idempotency": True, "broadcast_unknown_recovered_original_tx": True, "withdrawal_txid": confirmed["txid"], "sweep_txid": swept["txid"], "balance": trx, "reconciliation": "all differences zero"}
    (ROOT / ".local/http-acceptance.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
