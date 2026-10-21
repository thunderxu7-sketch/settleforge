#!/usr/bin/env python3
"""Signed local RFQ -> reserve -> two approvals -> atomic ledger settlement."""
import json
import os
import subprocess
import time
import uuid
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
config = dict(line.split("=", 1) for line in (ROOT / ".local/dev.env").read_text().splitlines() if line and not line.startswith("#"))
base = os.environ.get("SETTLEFORGE_API_URL", "http://127.0.0.1:8080")


def api(method, path, body=None, key=None, expected=200):
    headers = {"Authorization": "Bearer " + config["ADMIN_TOKEN"], "Content-Type": "application/json"}
    if key:
        headers["Idempotency-Key"] = key
    request = Request(base + path, data=None if body is None else json.dumps(body).encode(), method=method, headers=headers)
    try:
        response = urlopen(request, timeout=15)
    except HTTPError as error:
        if error.code != expected:
            raise
        response = error
    with response:
        assert response.code == expected, (path, response.code, expected)
        return json.load(response)


def balance(user, asset):
    return next(b for b in api("GET", "/v1/users/" + user + "/balances") if b["asset"] == asset)


def main():
    status = api("GET", "/v1/status")
    assert status.get("rfq_mode") == "local-simulated", "restart API with RFQ_LAB=1 (make local-up)"
    assert status["networks"]["evm-dev"] == "simulated", "funding must use the explicit simulator"
    user = api("POST", "/v1/users", {"external_ref": "rfq-demo-" + str(uuid.uuid4())}, expected=201)["id"]
    wallet = api("POST", "/v1/wallets", {"user_id": user, "network": "evm-dev", "purpose": "deposit"}, expected=201)
    api("POST", "/v1/dev/deposits", {"network": "evm-dev", "txid": "rfq-demo-" + str(uuid.uuid4()), "index": 0, "block_hash": "rfq-simulated-block", "height": 1, "wallet_id": wallet["id"], "asset": "evm-dev/ETH", "amount": "3000000000000000000", "confirmed": True})
    request = {"user_id": user, "network": "evm-dev", "sell_asset": "evm-dev/ETH", "buy_asset": "evm-dev/LABUSD", "sell_amount": "1000000000000000000"}
    quotes = api("POST", "/v1/rfq/quotes", request)
    assert len(quotes["quotes"]) == 2
    best = max(quotes["quotes"], key=lambda q: int(q["buy_amount"]))
    assert best["quote_id"] == quotes["best_quote_id"]
    accept = {"user_id": user, "quote_id": best["quote_id"], "min_buy_amount": best["buy_amount"]}
    key = str(uuid.uuid4())
    trade = api("POST", "/v1/rfq/trades", accept, key, 201)
    replay = api("POST", "/v1/rfq/trades", accept, key)
    assert trade["trade_id"] == replay["trade_id"]
    api("POST", "/v1/rfq/trades", dict(accept, min_buy_amount="1"), key, 409)
    b = balance(user, "evm-dev/ETH")
    assert (b["available"], b["frozen"]) == ("2000000000000000000", "1000000000000000000")
    for actor in ("operator-a", "operator-b"):
        subprocess.run([str(ROOT / "bin/settleforge"), "approve", "--kind", "rfq", "--id", trade["trade_id"], "--actor", actor, "--url", base], cwd=ROOT, check=True, capture_output=True)
    deadline = time.monotonic() + 15
    while True:
        settled = api("GET", "/v1/rfq/trades/" + trade["trade_id"])
        if settled["state"] == "settled":
            break
        if time.monotonic() >= deadline:
            raise RuntimeError("RFQ did not settle: " + settled["state"])
        time.sleep(0.1)
    usd = balance(user, "evm-dev/LABUSD")
    assert (usd["available"], usd["frozen"]) == (best["buy_amount"], "0")
    # Cancellation refunds both the user and maker reservation; no approval needed.
    next_quotes = api("POST", "/v1/rfq/quotes", request)
    cancel_trade = api("POST", "/v1/rfq/trades", {"user_id": user, "quote_id": next_quotes["best_quote_id"], "min_buy_amount": "1"}, str(uuid.uuid4()), 201)
    cancelled = api("POST", "/v1/rfq/trades/" + cancel_trade["trade_id"] + "/cancel", {})
    assert cancelled["state"] == "cancelled"
    eth = balance(user, "evm-dev/ETH")
    assert (eth["available"], eth["frozen"]) == ("2000000000000000000", "0")
    report = {"mode": "local-simulated", "pricing": "synthetic fixed rates; not live market prices", "settlement": "atomic PostgreSQL ledger exchange; no chain or external LP fill", "sources": [{"maker_id": q["maker_id"], "net_buy_amount": q["buy_amount"], "fee_amount": q["fee_amount"]} for q in quotes["quotes"]], "best_maker": best["maker_id"], "trade_id": trade["trade_id"], "state": settled["state"], "idempotency": True, "changed_replay_rejected": True, "two_operator_signatures": True, "cancellation_unfreezes": True, "balances": [eth, usd]}
    (ROOT / ".local/rfq-http-acceptance.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
