package service

import (
	"context"
	"crypto/ed25519"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thunderxu7-sketch/settleforge/internal/chain"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"github.com/thunderxu7-sketch/settleforge/internal/signing"
	"github.com/thunderxu7-sketch/settleforge/internal/store"
)

type fixture struct {
	s                 *Service
	sim               *chain.Simulator
	user              string
	deposit, treasury domain.Wallet
	dir               string
}

func setup(t *testing.T) *fixture {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run real PostgreSQL integration tests")
	}
	ctx := context.Background()
	admin, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	name := "test_" + strings.ReplaceAll(uuid.NewString(), "-", "")
	if _, err = admin.Exec(ctx, "CREATE SCHEMA "+name); err != nil {
		t.Fatal(err)
	}
	config, err := pgxpool.ParseConfig(url)
	if err != nil {
		t.Fatal(err)
	}
	config.ConnConfig.RuntimeParams["search_path"] = name
	config.MaxConns = 12
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Fatal(err)
	}
	st := &store.Store{DB: pool}
	t.Cleanup(func() { st.Close(); _, _ = admin.Exec(ctx, "DROP SCHEMA "+name+" CASCADE"); admin.Close() })
	if err = st.Migrate(ctx); err != nil {
		t.Fatal(err)
	}
	if err = st.Seed(ctx); err != nil {
		t.Fatal(err)
	}
	dir := t.TempDir()
	keys := signing.LocalKeys{Dir: filepath.Join(dir, "keys")}
	actors, err := signing.GenerateApprovers(filepath.Join(dir, "approvers"))
	if err != nil {
		t.Fatal(err)
	}
	sim, err := chain.OpenSimulator(filepath.Join(dir, "chain.json"))
	if err != nil {
		t.Fatal(err)
	}
	s := &Service{Store: st, Keys: keys, Provider: keys, Approvers: actors, Chains: map[string]chain.Adapter{"tron-nile": sim}}
	user, err := st.CreateUser(ctx, "test-user")
	if err != nil {
		t.Fatal(err)
	}
	deposit, err := s.CreateWallet(ctx, domain.Wallet{UserID: user, Network: "tron-nile", Purpose: "deposit"})
	if err != nil {
		t.Fatal(err)
	}
	treasury, err := s.CreateWallet(ctx, domain.Wallet{Network: "tron-nile", Purpose: "treasury"})
	if err != nil {
		t.Fatal(err)
	}
	f := &fixture{s: s, sim: sim, user: user, deposit: deposit, treasury: treasury, dir: dir}
	if err = sim.Credit(treasury.ID, "tron-nile/TRX", "10000"); err != nil {
		t.Fatal(err)
	}
	if err = st.Capital(ctx, treasury.ID, "tron-nile/TRX", "10000", "initial"); err != nil {
		t.Fatal(err)
	}
	return f
}
func (f *fixture) fund(t *testing.T, amount string) {
	t.Helper()
	d := domain.Deposit{Network: "tron-nile", TxID: "deposit-" + uuid.NewString(), BlockHash: "block-1", Height: 1, WalletID: f.deposit.ID, Asset: "tron-nile/TRX", Amount: amount, Confirmed: true}
	if err := f.sim.Credit(f.deposit.ID, d.Asset, amount); err != nil {
		t.Fatal(err)
	}
	if err := f.s.Store.Observe(context.Background(), d); err != nil {
		t.Fatal(err)
	}
}
func (f *fixture) intent(amount string) domain.Intent {
	return domain.Intent{WalletID: f.treasury.ID, UserID: f.user, Asset: "tron-nile/TRX", Network: "tron-nile", Destination: f.deposit.Address, Amount: amount, FeeCap: "10", ExpiresAt: time.Now().Add(time.Hour).Unix()}
}
func (f *fixture) approve(t *testing.T, w domain.Withdrawal) {
	t.Helper()
	for _, actor := range []string{"operator-a", "operator-b"} {
		key, err := os.ReadFile(filepath.Join(f.dir, "approvers", actor+".key"))
		if err != nil {
			t.Fatal(err)
		}
		proof := signing.SignApproval(w.Intent, actor, ed25519.PrivateKey(key))
		if err = f.s.Approve(context.Background(), w.ID, proof); err != nil {
			t.Fatal(err)
		}
	}
}
func (f *fixture) balances(t *testing.T) (string, string) {
	t.Helper()
	b, err := f.s.Store.Balances(context.Background(), f.user)
	if err != nil {
		t.Fatal(err)
	}
	for _, v := range b {
		if v.Asset == "tron-nile/TRX" {
			return v.Available, v.Frozen
		}
	}
	t.Fatal("missing balance")
	return "", ""
}

func TestDepositConfirmationDedupAndConflictingReplay(t *testing.T) {
	f := setup(t)
	ctx := context.Background()
	d := domain.Deposit{Network: "tron-nile", TxID: "deposit", BlockHash: "block", Height: 1, WalletID: f.deposit.ID, Asset: "tron-nile/TRX", Amount: "100"}
	if err := f.s.Store.Observe(ctx, d); err != nil {
		t.Fatal(err)
	}
	if a, _ := f.balances(t); a != "0" {
		t.Fatal("unconfirmed deposit credited")
	}
	d.Confirmed = true
	for range 30 {
		if err := f.s.Store.Observe(ctx, d); err != nil {
			t.Fatal(err)
		}
	}
	if a, b := f.balances(t); a != "100" || b != "0" {
		t.Fatalf("balances %s %s", a, b)
	}
	d.Amount = "101"
	if err := f.s.Store.Observe(ctx, d); !errors.Is(err, domain.ErrConflict) {
		t.Fatalf("conflicting replay: %v", err)
	}
}
func TestConcurrentWithdrawalsCannotOverspend(t *testing.T) {
	f := setup(t)
	f.fund(t, "100")
	ctx := context.Background()
	intent := f.intent("2")
	var accepted, rejected atomic.Int32
	var wg sync.WaitGroup
	for n := range 100 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, _, err := f.s.Create(ctx, intent, fmt.Sprintf("withdraw-%d", n), false)
			if err == nil {
				accepted.Add(1)
			} else if errors.Is(err, domain.ErrFunds) {
				rejected.Add(1)
			} else {
				t.Errorf("unexpected %v", err)
			}
		}()
	}
	wg.Wait()
	if accepted.Load() != 50 || rejected.Load() != 50 {
		t.Fatalf("accepted=%d rejected=%d", accepted.Load(), rejected.Load())
	}
	if a, b := f.balances(t); a != "0" || b != "100" {
		t.Fatalf("%s %s", a, b)
	}
}
func TestIdempotencyAndTamperedApproval(t *testing.T) {
	f := setup(t)
	f.fund(t, "100")
	ctx := context.Background()
	intent := f.intent("10")
	first, created, err := f.s.Create(ctx, intent, "stable", false)
	if err != nil || !created {
		t.Fatal(err)
	}
	for range 20 {
		w, new, err := f.s.Create(ctx, intent, "stable", false)
		if err != nil || new || w.ID != first.ID {
			t.Fatalf("replay %v", err)
		}
	}
	intent.Amount = "11"
	if _, _, err = f.s.Create(ctx, intent, "stable", false); !errors.Is(err, domain.ErrConflict) {
		t.Fatal(err)
	}
	key, err := os.ReadFile(filepath.Join(f.dir, "approvers/operator-a.key"))
	if err != nil {
		t.Fatal(err)
	}
	tampered := first.Intent
	tampered.Amount = "12"
	if err = f.s.Approve(ctx, first.ID, signing.SignApproval(tampered, "operator-a", ed25519.PrivateKey(key))); !errors.Is(err, domain.ErrApproval) {
		t.Fatal("tampered approval accepted")
	}
	if a, b := f.balances(t); a != "90" || b != "10" {
		t.Fatalf("%s %s", a, b)
	}
}
func TestUnknownBroadcastRestartAndExactlyOnceSettlement(t *testing.T) {
	f := setup(t)
	f.fund(t, "100")
	ctx := context.Background()
	w, _, err := f.s.Create(ctx, f.intent("25"), "unknown", false)
	if err != nil {
		t.Fatal(err)
	}
	f.approve(t, w)
	f.sim.FailNextBroadcast()
	if err = f.s.Process(ctx, w.ID); !errors.Is(err, chain.ErrUnknown) {
		t.Fatalf("wanted unknown: %v", err)
	}
	w, err = f.s.Store.Withdrawal(ctx, w.ID)
	if err != nil || w.State != "broadcast_unknown" {
		t.Fatalf("%s %v", w.State, err)
	}
	if a, b := f.balances(t); a != "75" || b != "25" {
		t.Fatalf("%s %s", a, b)
	}
	// Reopen the persistent chain and instantiate a new worker service.
	sim, err := chain.OpenSimulator(f.sim.Path)
	if err != nil {
		t.Fatal(err)
	}
	f.s.Chains["tron-nile"] = sim
	_ = f.s.Process(ctx, w.ID)
	wallets, err := f.s.Store.Wallets(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if err = sim.Mine(wallets); err != nil {
		t.Fatal(err)
	}
	for range 10 {
		if err = f.s.Process(ctx, w.ID); err != nil {
			t.Fatal(err)
		}
	}
	if a, b := f.balances(t); a != "75" || b != "0" {
		t.Fatalf("%s %s", a, b)
	}
	var count int
	if err = f.s.Store.DB.QueryRow(ctx, `SELECT count(*) FROM journals WHERE ref=$1`, "settle:"+w.ID).Scan(&count); err != nil || count != 1 {
		t.Fatalf("settlement count %d %v", count, err)
	}
}
func TestSweepDoesNotChangeUserLiabilityAndReconciles(t *testing.T) {
	f := setup(t)
	f.fund(t, "100")
	ctx := context.Background()
	i := f.intent("90")
	i.WalletID = f.deposit.ID
	i.Destination = f.treasury.Address
	w, _, err := f.s.Create(ctx, i, "sweep", true)
	if err != nil {
		t.Fatal(err)
	}
	f.approve(t, w)
	_ = f.s.Process(ctx, w.ID)
	wallets, err := f.s.Store.Wallets(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if err = f.sim.Mine(wallets); err != nil {
		t.Fatal(err)
	}
	if err = f.s.Process(ctx, w.ID); err != nil {
		t.Fatal(err)
	}
	if a, b := f.balances(t); a != "100" || b != "0" {
		t.Fatalf("sweep changed liability: %s %s", a, b)
	}
	report, err := f.s.Reconcile(ctx)
	if err != nil {
		t.Fatal(err)
	}
	for _, r := range report {
		if r.Difference != "0" {
			t.Fatalf("unreconciled %+v", r)
		}
	}
}
func TestLedgerRejectsUnbalancedAndMutableRecords(t *testing.T) {
	f := setup(t)
	ctx := context.Background()
	tx, err := f.s.Store.DB.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = tx.Exec(ctx, `INSERT INTO journals(asset,ref,fingerprint) VALUES('tron-nile/TRX','bad','bad')`); err != nil {
		t.Fatal(err)
	}
	if err = tx.Commit(ctx); err == nil {
		t.Fatal("empty journal committed")
	}
	if _, err = f.s.Store.DB.Exec(ctx, `UPDATE entries SET amount=amount+1 WHERE id=(SELECT min(id) FROM entries)`); err == nil {
		t.Fatal("ledger mutation allowed")
	}
	if err = f.s.Store.Capital(ctx, f.treasury.ID, "tron-nile/TRX", "10001", "initial"); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("conflicting capital replay accepted", err)
	}
}
func TestReorgCompensatesAndStopsNewWithdrawal(t *testing.T) {
	f := setup(t)
	f.fund(t, "100")
	ctx := context.Background()
	w, _, err := f.s.Create(ctx, f.intent("50"), "before-reorg", false)
	if err != nil {
		t.Fatal(err)
	}
	f.approve(t, w)
	if err = f.s.Store.ReverseDeposit(ctx, "tron-nile", "block-1"); err != nil {
		t.Fatal(err)
	}
	if a, b := f.balances(t); a != "-50" || b != "50" {
		t.Fatalf("%s %s", a, b)
	}
	if _, _, err = f.s.Create(ctx, f.intent("1"), "after-reorg", false); !errors.Is(err, domain.ErrState) {
		t.Fatal(err)
	}
	if err = f.s.Process(ctx, w.ID); err != nil {
		t.Fatal(err)
	}
	w, err = f.s.Store.Withdrawal(ctx, w.ID)
	if err != nil || w.State != "review" {
		t.Fatalf("%s %v", w.State, err)
	}
}
