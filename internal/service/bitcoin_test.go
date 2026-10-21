package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"github.com/thunderxu7-sketch/settleforge/internal/chain"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"github.com/thunderxu7-sketch/settleforge/internal/mpclab"
	"github.com/thunderxu7-sketch/settleforge/internal/signing"
	"os"
	"testing"
	"time"
)

func TestBitcoinCoreRegtestDepositWithdrawSweepReorg(t *testing.T) {
	endpoint := os.Getenv("TEST_BITCOIN_RPC_URL")
	if endpoint == "" {
		t.Skip("set TEST_BITCOIN_RPC_URL for real Bitcoin Core regtest acceptance")
	}
	f := setup(t)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	rpc := chain.RPC{URL: endpoint, User: "settleforge", Password: "local-regtest-only"}
	btc := &chain.Bitcoin{RPC: rpc, Store: f.s.Store, Confirmations: 2, SatPerVByte: 2}
	if err := btc.Ensure(ctx); err != nil {
		t.Fatal(err)
	}
	f.s.Chains["btc-regtest"] = btc
	var result any
	err := rpc.Call(ctx, "createwallet", []any{"settleforge-miner"}, &result)
	if err != nil {
		var e *chain.RPCError
		if !errors.As(err, &e) || (e.Code != -4 && e.Code != -35) {
			t.Fatal(err)
		}
	}
	miner := rpc
	miner.URL += "/wallet/settleforge-miner"
	var miningAddress string
	if err = miner.Call(ctx, "getnewaddress", []any{}, &miningAddress); err != nil {
		t.Fatal(err)
	}
	mine := func(n int) {
		t.Helper()
		var hashes []string
		if e := rpc.Call(ctx, "generatetoaddress", []any{n, miningAddress}, &hashes); e != nil {
			t.Fatal(e)
		}
	}
	mine(101)
	treasury, err := f.s.CreateWallet(ctx, domain.Wallet{Network: "btc-regtest", Purpose: "treasury"})
	if err != nil {
		t.Fatal(err)
	}
	var external signing.Provider
	var keyRef string
	switch os.Getenv("TEST_SIGNER_MODE") {
	case "mpc":
		external = &mpclab.Provider{Dir: os.Getenv("TEST_MPC_DIR"), Participants: []int{1, 3}}
		keyRef = "mpc-2of3"
	case "pkcs11":
		hsm, e := signing.OpenPKCS11(os.Getenv("TEST_PKCS11_MODULE"), "SettleForge-test", os.Getenv("TEST_PKCS11_PIN"))
		if e != nil {
			t.Fatal(e)
		}
		defer hsm.Close()
		keyRef, e = hsm.Create(ctx)
		if e != nil {
			t.Fatal(e)
		}
		external = hsm
	}
	if external != nil {
		pub, e := external.PublicKey(ctx, keyRef)
		if e != nil {
			t.Fatal(e)
		}
		address, e := signing.Address("btc-regtest", pub)
		if e != nil {
			t.Fatal(e)
		}
		w := domain.Wallet{Network: "btc-regtest", Address: address, KeyRef: keyRef, Purpose: "treasury"}
		if e = btc.Register(ctx, w, pub); e != nil {
			t.Fatal(e)
		}
		treasury, e = f.s.Store.AddWallet(ctx, w)
		if e != nil {
			t.Fatal(e)
		}
		f.s.Provider = signing.Routed{Default: f.s.Provider, ByRef: map[string]signing.Provider{keyRef: external}}
	}
	deposit, err := f.s.CreateWallet(ctx, domain.Wallet{UserID: f.user, Network: "btc-regtest", Purpose: "deposit"})
	if err != nil {
		t.Fatal(err)
	}
	fund := func(address, amount string) string {
		t.Helper()
		var txid string
		if e := miner.Call(ctx, "sendtoaddress", []any{address, json.Number(amount)}, &txid); e != nil {
			t.Fatal(e)
		}
		return txid
	}
	fund(treasury.Address, "0.01000000")
	fund(deposit.Address, "0.00200000")
	mine(2)
	if err = btc.Sync(ctx); err != nil {
		t.Fatal(err)
	}
	if err = btc.Sync(ctx); err != nil {
		t.Fatal(err)
	}
	balances, err := f.s.Store.Balances(ctx, f.user)
	if err != nil {
		t.Fatal(err)
	}
	var initial string
	for _, b := range balances {
		if b.Asset == "btc-regtest/BTC" {
			initial = b.Available
		}
	}
	if initial != "200000" {
		t.Fatalf("BTC deposit dedup balance=%s", initial)
	}
	var destination string
	if err = miner.Call(ctx, "getnewaddress", []any{}, &destination); err != nil {
		t.Fatal(err)
	}
	create := func(wallet domain.Wallet, to, amount string, sweep bool) domain.Withdrawal {
		t.Helper()
		w, _, e := f.s.Create(ctx, domain.Intent{WalletID: wallet.ID, UserID: f.user, Asset: "btc-regtest/BTC", Network: "btc-regtest", Destination: to, Amount: amount, FeeCap: "5000", ExpiresAt: time.Now().Add(time.Hour).Unix()}, uuid.NewString(), sweep)
		if e != nil {
			t.Fatal(e)
		}
		f.approve(t, w)
		return w
	}
	execute := func(w domain.Withdrawal) {
		t.Helper()
		_ = f.s.Process(ctx, w.ID)
		status, e := f.s.Store.Withdrawal(ctx, w.ID)
		if e != nil || status.TxID == "" {
			t.Fatalf("transaction not signed/broadcast: %v %+v", e, status)
		}
		var pool any
		if e = rpc.Call(ctx, "getmempoolentry", []any{status.TxID}, &pool); e != nil {
			t.Fatal(e)
		}
		mine(2)
		if e = btc.Sync(ctx); e != nil {
			t.Fatal(e)
		}
		if e = f.s.Process(ctx, w.ID); e != nil {
			t.Fatal(e)
		}
		if e = f.s.Process(ctx, w.ID); e != nil {
			t.Fatal(e)
		}
		status, e = f.s.Store.Withdrawal(ctx, w.ID)
		if e != nil || status.State != "confirmed" {
			t.Fatalf("not confirmed %+v %v", status, e)
		}
		t.Logf("%s txid=%s", w.Kind, status.TxID)
	}
	withdrawal := create(treasury, destination, "50000", false)
	execute(withdrawal)
	sweep := create(deposit, treasury.Address, "150000", true)
	execute(sweep)
	balances, err = f.s.Store.Balances(ctx, f.user)
	if err != nil {
		t.Fatal(err)
	}
	for _, b := range balances {
		if b.Asset == "btc-regtest/BTC" && (b.Available != "150000" || b.Frozen != "0") {
			t.Fatalf("sweep changed liability %+v", b)
		}
	}
	diffs, err := f.s.Reconcile(ctx)
	if err != nil {
		t.Fatal(err)
	}
	for _, d := range diffs {
		if d.Asset == "btc-regtest/BTC" && d.Difference != "0" {
			t.Fatalf("reconciliation %+v", d)
		}
	}
	txid := fund(deposit.Address, "0.00010000")
	mine(2)
	if err = btc.Sync(ctx); err != nil {
		t.Fatal(err)
	}
	var tx struct {
		BlockHash string `json:"blockhash"`
	}
	if err = rpc.Call(ctx, "getrawtransaction", []any{txid, true}, &tx); err != nil {
		t.Fatal(err)
	}
	if err = rpc.Call(ctx, "invalidateblock", []any{tx.BlockHash}, &result); err != nil {
		t.Fatal(err)
	}
	if err = btc.Sync(ctx); err != nil {
		t.Fatal(err)
	}
	active, err := f.s.Store.UserActive(ctx, f.user)
	if err != nil || active {
		t.Fatal("reorg must quarantine user", err)
	}
	var amount string
	if err = f.s.Store.DB.QueryRow(ctx, `SELECT (-COALESCE(sum(e.amount),0))::text FROM entries e JOIN accounts a ON a.id=e.account_id WHERE a.asset='btc-regtest/BTC' AND a.code=$1`, "user:"+f.user+":available").Scan(&amount); err != nil {
		t.Fatal(err)
	}
	if amount != "150000" {
		t.Fatal(fmt.Sprintf("reorg compensation balance=%s", amount))
	}
	// Reinclude the same tx in a different block. Its second credit must have a
	// new journal generation, while the user stays quarantined for review.
	if err = miner.Call(ctx, "getnewaddress", []any{}, &miningAddress); err != nil {
		t.Fatal(err)
	}
	mine(3)
	if err = btc.Sync(ctx); err != nil {
		t.Fatal(err)
	}
	if err = f.s.Store.DB.QueryRow(ctx, `SELECT amount::text FROM deposits WHERE txid=$1 AND state='credited' AND generation=1`, txid).Scan(&amount); err != nil || amount != "10000" {
		t.Fatalf("re-inclusion: %s %v", amount, err)
	}
}
