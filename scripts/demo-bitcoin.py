#!/usr/bin/env python3
"""Exercise the real Bitcoin Core regtest adapter through the running HTTP API."""
import base64
import json
import os
import time
import uuid
from decimal import Decimal
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from demo import ROOT, api, approve, wait_state


class RPCError(RuntimeError):
    def __init__(self, code):
        self.code = code
        super().__init__(f"Bitcoin regtest RPC error {code}")


def rpc(method, params, wallet=None):
    port = os.environ.get("BITCOIN_RPC_PORT", "18443")
    if not port.isdecimal() or not 1024 <= int(port) <= 65535:
        raise RuntimeError("invalid local Bitcoin RPC port")
    url = "http://127.0.0.1:" + port
    if wallet:
        url += "/wallet/" + wallet
    credential = base64.b64encode(b"settleforge:local-regtest-only").decode()
    request = Request(url, data=json.dumps({"jsonrpc": "2.0", "id": "local-demo", "method": method, "params": params}).encode(), headers={"Authorization": "Basic " + credential, "Content-Type": "application/json"})
    try:
        response = urlopen(request, timeout=30)
    except HTTPError as error:
        response = error
    with response:
        result = json.load(response, parse_float=Decimal)
    if result.get("error"):
        raise RPCError(result["error"]["code"])
    return result["result"]


def btc_balance(user):
    return next(b for b in api("GET", "/v1/users/" + user + "/balances") if b["asset"] == "btc-regtest/BTC")


def wait_deposit(user, amount):
    for _ in range(200):
        balance = btc_balance(user)
        if balance["available"] == amount:
            return balance
        time.sleep(0.1)
    raise RuntimeError("confirmed BTC deposit was not indexed")


def main():
    assert api("GET", "/v1/status")["networks"]["btc-regtest"] == "rpc", "start with make local-up to enable Bitcoin Core"
    assert rpc("getblockchaininfo", [])["chain"] == "regtest", "regtest is required"
    miner = "settleforge-demo-miner"
    loaded = rpc("listwallets", [])
    if miner not in loaded:
        try:
            rpc("createwallet", [miner])
        except RPCError as error:
            if error.code != -4:
                raise
            rpc("loadwallet", [miner])
    mining_address = rpc("getnewaddress", [], miner)

    def mine(count):
        return rpc("generatetoaddress", [count, mining_address])

    mine(101)
    user = api("POST", "/v1/users", {"external_ref": "btc-local-" + str(uuid.uuid4())})["id"]
    deposit = api("POST", "/v1/wallets", {"user_id": user, "network": "btc-regtest", "purpose": "deposit"})
    treasury = api("POST", "/v1/wallets", {"network": "btc-regtest", "purpose": "treasury"})
    # Core accepts decimal amount strings. No binary floating point is used.
    rpc("sendtoaddress", [treasury["address"], "0.01000000"], miner)
    funding_txid = rpc("sendtoaddress", [deposit["address"], "0.00200000"], miner)
    mine(2)
    wait_deposit(user, "200000")
    destination = rpc("getnewaddress", [], miner)
    intent = {"user_id": user, "wallet_id": treasury["id"], "network": "btc-regtest", "asset": "btc-regtest/BTC", "destination": destination, "amount": "50000", "fee_cap": "5000", "expires_at": int(time.time()) + 3600}
    key = str(uuid.uuid4())
    withdrawal = api("POST", "/v1/withdrawals", intent, key)
    assert api("POST", "/v1/withdrawals", intent, key)["id"] == withdrawal["id"]

    def execute(operation):
        approve(operation["id"])
        pending = wait_state(operation["id"], {"broadcast", "broadcast_unknown"})
        assert pending["txid"], "persisted transaction ID missing"
        rpc("getmempoolentry", [pending["txid"]])
        mine(2)
        confirmed = wait_state(operation["id"], {"confirmed"})
        receipt = rpc("getrawtransaction", [confirmed["txid"], True])
        assert receipt["confirmations"] >= 2
        return confirmed, receipt

    withdrawn, receipt = execute(withdrawal)
    balance_after_withdrawal = btc_balance(user)
    assert (balance_after_withdrawal["available"], balance_after_withdrawal["frozen"]) == ("150000", "0")
    sweep_intent = dict(intent, wallet_id=deposit["id"], destination=treasury["address"], amount="150000")
    sweep = api("POST", "/v1/sweeps", sweep_intent, str(uuid.uuid4()))
    swept, _ = execute(sweep)
    assert btc_balance(user) == balance_after_withdrawal, "sweep must not change user liability"
    # Reconciliation is meaningful after confirmation and with no concurrent
    # transactions. The demo uses only this user's BTC wallets for its assertion.
    relevant = {deposit["id"], treasury["id"]}
    rows = [row for row in api("GET", "/v1/reconciliation") if row["wallet_id"] in relevant]
    assert len(rows) == 2 and all(row["difference"] == "0" for row in rows), rows
    report = {"mode": "real Bitcoin Core regtest through HTTP", "funding_txid": funding_txid, "withdrawal_txid": withdrawn["txid"], "withdrawal_block_hash": receipt["blockhash"], "confirmations_at_check": receipt["confirmations"], "sweep_txid": swept["txid"], "idempotency": True, "core_mempool_accepted": True, "balance": btc_balance(user), "sweep_preserves_liability": True, "reconciliation": "both BTC wallets have zero difference"}
    (ROOT / ".local/bitcoin-http-acceptance.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
