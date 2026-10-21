package rfq_test

import (
	"bytes"
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"github.com/thunderxu7-sketch/settleforge/internal/httpapi"
	"github.com/thunderxu7-sketch/settleforge/internal/rfq"
	"github.com/thunderxu7-sketch/settleforge/internal/service"
	"github.com/thunderxu7-sketch/settleforge/internal/signing"
	"github.com/thunderxu7-sketch/settleforge/internal/store"
)

type source struct {
	*rfq.LabMaker
	mutate func(*domain.RFQQuote)
	delay  time.Duration
}

func (s source) Quote(ctx context.Context, r domain.RFQRequest) (domain.RFQQuote, error) {
	if s.delay > 0 {
		select {
		case <-ctx.Done():
			return domain.RFQQuote{}, ctx.Err()
		case <-time.After(s.delay):
		}
	}
	q, err := s.LabMaker.Quote(ctx, r)
	if s.mutate != nil {
		s.mutate(&q)
	}
	return q, err
}

func maker(t *testing.T, id string, price, fee int64) *rfq.LabMaker {
	t.Helper()
	_, key, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	return &rfq.LabMaker{Name: id, Key: key, PriceUSD: price, FeeBPS: fee}
}

func request(user, amount string) domain.RFQRequest {
	return domain.RFQRequest{UserID: user, Network: "evm-dev", SellAsset: rfq.ETH, BuyAsset: rfq.USD, SellAmount: amount}
}

func TestRFQSignedQuotesFeesAndSourceTimeout(t *testing.T) {
	in := request(uuid.NewString(), "1000000000000000000")
	in.ID = uuid.NewString()
	// Higher gross price loses after its larger fee. The slow source times out.
	a, b := maker(t, "a", 2500, 20), maker(t, "b", 2510, 100)
	start := time.Now()
	out, err := rfq.Collect(context.Background(), in, []rfq.Source{a, b, source{LabMaker: maker(t, "slow", 9999, 0), delay: time.Second}}, 30*time.Millisecond)
	if err != nil || len(out.Quotes) != 2 || out.Quotes[0].MakerID != "a" || out.Quotes[0].BuyAmount != "2495000000" || out.Quotes[0].FeeAmount != "5000000" || out.Rejected["slow"] != "timeout" {
		t.Fatalf("bad net selection: %+v %v", out, err)
	}
	if time.Since(start) > 500*time.Millisecond {
		t.Fatal("slow source blocked healthy quotes")
	}
	for _, mutate := range []func(*domain.RFQQuote){
		func(q *domain.RFQQuote) { q.BuyAmount = "999999999999" },
		func(q *domain.RFQQuote) { q.FeeAmount = "0" },
		func(q *domain.RFQQuote) { q.UserID = uuid.NewString() },
		func(q *domain.RFQQuote) { q.SellAsset = rfq.USD },
		func(q *domain.RFQQuote) { q.Network = "mainnet" },
		func(q *domain.RFQQuote) { q.ExpiresAt = time.Now().Unix() - 1 },
		func(q *domain.RFQQuote) { q.ExpiresAt = time.Now().Unix() + 1000 },
		func(q *domain.RFQQuote) { q.Signature = "bad" },
	} {
		out, err = rfq.Collect(context.Background(), in, []rfq.Source{a, source{LabMaker: b, mutate: mutate}}, time.Second)
		if err != nil || len(out.Quotes) != 1 || out.Rejected["b"] != "invalid_quote" {
			t.Fatalf("tampered offer accepted: %+v %v", out, err)
		}
	}
	zero := request(in.UserID, "1")
	zero.ID = in.ID
	if _, err = a.Quote(context.Background(), zero); !errors.Is(err, domain.ErrInvalid) {
		t.Fatal("rounded-to-zero quote accepted", err)
	}
}

type fixture struct {
	s      *rfq.Service
	user   string
	dir    string
	wallet string
}

func setup(t *testing.T, amount string) *fixture {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL for real RFQ PostgreSQL acceptance")
	}
	ctx := context.Background()
	admin, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	name := "rfq_" + strings.ReplaceAll(uuid.NewString(), "-", "")
	if _, err = admin.Exec(ctx, "CREATE SCHEMA "+name); err != nil {
		t.Fatal(err)
	}
	cfg, err := pgxpool.ParseConfig(url)
	if err != nil {
		t.Fatal(err)
	}
	cfg.ConnConfig.RuntimeParams["search_path"] = name
	cfg.MaxConns = 16
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
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
	sources, err := rfq.OpenLab(ctx, st, filepath.Join(dir, "makers"))
	if err != nil {
		t.Fatal(err)
	}
	actors, err := signing.GenerateApprovers(filepath.Join(dir, "approvers"))
	if err != nil {
		t.Fatal(err)
	}
	user, err := st.CreateUser(ctx, "rfq-test")
	if err != nil {
		t.Fatal(err)
	}
	wallet, err := st.AddWallet(ctx, domain.Wallet{UserID: user, Network: "evm-dev", Address: "0x0000000000000000000000000000000000000001", KeyRef: "lab-only", Purpose: "deposit"})
	if err != nil {
		t.Fatal(err)
	}
	if err = st.Observe(ctx, domain.Deposit{Network: "evm-dev", TxID: "local-funding", BlockHash: "local-block", Height: 1, WalletID: wallet.ID, Asset: rfq.ETH, Amount: amount, Confirmed: true}); err != nil {
		t.Fatal(err)
	}
	return &fixture{s: &rfq.Service{Store: st, Sources: sources, Approvers: actors}, user: user, dir: dir, wallet: wallet.ID}
}

func (f *fixture) quote(t *testing.T, amount string) domain.RFQQuote {
	t.Helper()
	out, err := f.s.Request(context.Background(), request(f.user, amount))
	if err != nil || len(out.Quotes) != 2 {
		t.Fatalf("quotes %+v %v", out, err)
	}
	return out.Quotes[0]
}

func (f *fixture) accept(t *testing.T, q domain.RFQQuote) domain.RFQTrade {
	t.Helper()
	trade, created, err := f.s.Accept(context.Background(), domain.RFQAccept{UserID: f.user, QuoteID: q.QuoteID, MinBuyAmount: q.BuyAmount}, uuid.NewString())
	if err != nil || !created {
		t.Fatal("accept", err)
	}
	return trade
}

func (f *fixture) proof(t *testing.T, in domain.RFQTradeIntent, actor string) domain.Approval {
	t.Helper()
	key, err := os.ReadFile(filepath.Join(f.dir, "approvers", actor+".key"))
	if err != nil {
		t.Fatal(err)
	}
	return rfq.SignApproval(in, actor, ed25519.PrivateKey(key))
}

func (f *fixture) balance(t *testing.T, asset string) domain.Balance {
	t.Helper()
	all, err := f.s.Store.Balances(context.Background(), f.user)
	if err != nil {
		t.Fatal(err)
	}
	for _, b := range all {
		if b.Asset == asset {
			return b
		}
	}
	t.Fatal("missing asset", asset)
	return domain.Balance{}
}

func TestRFQSettlementApprovalsAndReplay(t *testing.T) {
	f := setup(t, "2000000000000000000")
	ctx := context.Background()
	q := f.quote(t, "1000000000000000000")
	in := domain.RFQAccept{UserID: f.user, QuoteID: q.QuoteID, MinBuyAmount: q.BuyAmount}
	var created atomic.Int32
	var wg sync.WaitGroup
	ids := make(chan string, 16)
	for range 16 {
		wg.Go(func() {
			trade, fresh, err := f.s.Accept(ctx, in, "same-key")
			if err != nil {
				t.Error(err)
				return
			}
			if fresh {
				created.Add(1)
			}
			ids <- trade.TradeID
		})
	}
	wg.Wait()
	close(ids)
	if created.Load() != 1 {
		t.Fatal("duplicate creation", created.Load())
	}
	var id string
	for next := range ids {
		if id != "" && next != id {
			t.Fatal("idempotency returned another trade")
		}
		id = next
	}
	trade, err := f.s.Store.RFQTrade(ctx, id)
	if err != nil {
		t.Fatal(err)
	}
	changed := in
	changed.MinBuyAmount = "1"
	if _, _, err = f.s.Accept(ctx, changed, "same-key"); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("changed replay accepted", err)
	}
	if _, _, err = f.s.Accept(ctx, in, "different-key"); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("quote consumed twice", err)
	}
	if b := f.balance(t, rfq.ETH); b.Available != "1000000000000000000" || b.Frozen != "1000000000000000000" {
		t.Fatal(b)
	}
	tampered := trade.RFQTradeIntent
	tampered.MinBuyAmount = "1"
	if err = f.s.Approve(ctx, id, f.proof(t, tampered, "operator-a")); !errors.Is(err, domain.ErrApproval) {
		t.Fatal("tampered approval accepted", err)
	}
	for range 2 {
		if err = f.s.Approve(ctx, id, f.proof(t, trade.RFQTradeIntent, "operator-a")); err != nil {
			t.Fatal(err)
		}
	}
	if err = f.s.Process(ctx, id, false); err != nil {
		t.Fatal(err)
	}
	if b := f.balance(t, rfq.USD); b.Available != "0" {
		t.Fatal("single actor settled", b)
	}
	if err = f.s.Approve(ctx, id, f.proof(t, trade.RFQTradeIntent, "operator-b")); err != nil {
		t.Fatal(err)
	}
	// A reconstructed service and concurrent workers settle exactly once.
	restarted := &rfq.Service{Store: f.s.Store, Approvers: f.s.Approvers}
	for range 16 {
		wg.Go(func() {
			if err := restarted.Process(ctx, id, false); err != nil {
				t.Error(err)
			}
		})
	}
	wg.Wait()
	if b := f.balance(t, rfq.USD); b.Available != q.BuyAmount || b.Frozen != "0" {
		t.Fatal(b)
	}
	if b := f.balance(t, rfq.ETH); b.Available != "1000000000000000000" || b.Frozen != "0" {
		t.Fatal(b)
	}
	trade, err = restarted.Store.RFQTrade(ctx, id)
	if err != nil || trade.State != "settled" {
		t.Fatal(trade.State, err)
	}
	replay, fresh, err := f.s.Accept(ctx, in, "same-key")
	if err != nil || fresh || replay.State != "settled" {
		t.Fatal("settled replay", err)
	}
	var journals int
	if err = f.s.Store.DB.QueryRow(ctx, `SELECT count(*) FROM journals WHERE ref LIKE $1`, "rfq-settled-%:"+id).Scan(&journals); err != nil || journals != 2 {
		t.Fatal("settlement journals", journals, err)
	}
	var fee string
	if err = f.s.Store.DB.QueryRow(ctx, `SELECT (-sum(e.amount))::text FROM entries e JOIN accounts a ON a.id=e.account_id WHERE a.code='rfq-fees'`).Scan(&fee); err != nil || fee != q.FeeAmount {
		t.Fatal("fee ledger", fee, err)
	}
	// Quote records are immutable, and public keys cannot silently change.
	if _, err = f.s.Store.DB.Exec(ctx, `UPDATE rfq_quotes SET fingerprint='tampered' WHERE id=$1`, q.QuoteID); err == nil {
		t.Fatal("quote mutation accepted")
	}
	if err = f.s.Store.RegisterRFQMaker(ctx, "lab-alpha", maker(t, "x", 1, 0).PublicKey()); !errors.Is(err, domain.ErrConflict) {
		t.Fatal("maker key silently rotated", err)
	}
}

func TestRFQConcurrentAcceptCannotOverspend(t *testing.T) {
	f := setup(t, "10000000000000000000")
	ctx := context.Background()
	quotes := make([]domain.RFQQuote, 40)
	for i := range quotes {
		quotes[i] = f.quote(t, "1000000000000000000")
	}
	var accepted, rejected atomic.Int32
	var wg sync.WaitGroup
	for i, q := range quotes {
		wg.Go(func() {
			_, _, err := f.s.Accept(ctx, domain.RFQAccept{UserID: f.user, QuoteID: q.QuoteID, MinBuyAmount: "1"}, fmt.Sprint(i))
			if err == nil {
				accepted.Add(1)
			} else if errors.Is(err, domain.ErrFunds) {
				rejected.Add(1)
			} else {
				t.Error(err)
			}
		})
	}
	wg.Wait()
	if accepted.Load() != 10 || rejected.Load() != 30 {
		t.Fatalf("accepted=%d rejected=%d", accepted.Load(), rejected.Load())
	}
	if b := f.balance(t, rfq.ETH); b.Available != "0" || b.Frozen != "10000000000000000000" {
		t.Fatal(b)
	}
}

func TestRFQExpiryCancellationAndRecovery(t *testing.T) {
	f := setup(t, "3000000000000000000")
	ctx := context.Background()
	q := f.quote(t, "1000000000000000000")
	cancelled := f.accept(t, q)
	for range 3 {
		if err := f.s.Process(ctx, cancelled.TradeID, true); err != nil {
			t.Fatal(err)
		}
	}
	// A genuinely signed short-lived quote, rather than mutating persisted JSON.
	in := request(f.user, "1000000000000000000")
	in.ID = uuid.NewString()
	m := f.s.Sources[0].(*rfq.LabMaker)
	q, err := m.Quote(ctx, in)
	if err != nil {
		t.Fatal(err)
	}
	q.ExpiresAt = time.Now().Unix() + 2
	q.Signature = base64.StdEncoding.EncodeToString(ed25519.Sign(m.Key, rfq.QuotePayload(q.RFQOffer)))
	if err = f.s.Store.SaveRFQQuotes(ctx, []domain.RFQQuote{q}); err != nil {
		t.Fatal(err)
	}
	expiring := f.accept(t, q)
	for time.Now().Unix() < q.ExpiresAt {
		time.Sleep(25 * time.Millisecond)
	}
	if _, _, err = f.s.Accept(ctx, domain.RFQAccept{UserID: f.user, QuoteID: q.QuoteID, MinBuyAmount: "1"}, "expired"); !errors.Is(err, domain.ErrState) {
		t.Fatal("expired offer accepted", err)
	}
	worker := &rfq.Service{Store: f.s.Store, Approvers: f.s.Approvers}
	workerCtx, cancel := context.WithCancel(ctx)
	defer cancel()
	done := make(chan struct{})
	go func() { defer close(done); worker.RunWorker(workerCtx) }()
	for deadline := time.Now().Add(3 * time.Second); ; {
		state, err := f.s.Store.RFQTrade(ctx, expiring.TradeID)
		if err != nil {
			t.Fatal(err)
		}
		if state.State == "expired" {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("worker did not expire reservation")
		}
		time.Sleep(25 * time.Millisecond)
	}
	cancel()
	<-done
	if b := f.balance(t, rfq.ETH); b.Available != "3000000000000000000" || b.Frozen != "0" {
		t.Fatal(b)
	}
	var frozen string
	if err = f.s.Store.DB.QueryRow(ctx, `SELECT COALESCE(sum(e.amount),0)::text FROM entries e JOIN accounts a ON a.id=e.account_id WHERE a.code LIKE 'user:rfq-maker:%:frozen'`).Scan(&frozen); err != nil || frozen != "0" {
		t.Fatal("maker reserve leaked", frozen, err)
	}
}

func TestRFQPreflightLimitsAndReview(t *testing.T) {
	f := setup(t, "2000000000000000000000")
	ctx := context.Background()
	q := f.quote(t, "1000000000000000000")
	min, _ := new(big.Int).SetString(q.BuyAmount, 10)
	min.Add(min, big.NewInt(1))
	if _, _, err := f.s.Accept(ctx, domain.RFQAccept{UserID: f.user, QuoteID: q.QuoteID, MinBuyAmount: min.String()}, "min"); !errors.Is(err, domain.ErrInvalid) {
		t.Fatal("minimum output ignored", err)
	}
	other, err := f.s.Store.CreateUser(ctx, "other")
	if err != nil {
		t.Fatal(err)
	}
	if _, _, err = f.s.Accept(ctx, domain.RFQAccept{UserID: other, QuoteID: q.QuoteID, MinBuyAmount: "1"}, "wrong-user"); !errors.Is(err, domain.ErrNotFound) {
		t.Fatal("another taker consumed offer", err)
	}
	large := f.quote(t, "1000000000000000000000")
	if _, _, err = f.s.Accept(ctx, domain.RFQAccept{UserID: f.user, QuoteID: large.QuoteID, MinBuyAmount: "1"}, "maker-funds"); !errors.Is(err, domain.ErrFunds) {
		t.Fatal("maker inventory overspent", err)
	}
	trade := f.accept(t, q)
	for _, actor := range []string{"operator-a", "operator-b"} {
		if err = f.s.Approve(ctx, trade.TradeID, f.proof(t, trade.RFQTradeIntent, actor)); err != nil {
			t.Fatal(err)
		}
	}
	if _, err = f.s.Store.DB.Exec(ctx, `UPDATE users SET state='review' WHERE id=$1`, f.user); err != nil {
		t.Fatal(err)
	}
	if err = f.s.Process(ctx, trade.TradeID, false); !errors.Is(err, domain.ErrState) {
		t.Fatal("review account settled", err)
	}
	if err = f.s.Process(ctx, trade.TradeID, true); err != nil {
		t.Fatal("review account cancellation failed", err)
	}
	if _, err = f.s.Request(ctx, request(f.user, "1")); !errors.Is(err, domain.ErrState) {
		t.Fatal("review account quoted", err)
	}
}

func TestRFQSettlementRollsBackBothAssets(t *testing.T) {
	f := setup(t, "1000000000000000000")
	ctx := context.Background()
	trade := f.accept(t, f.quote(t, "1000000000000000000"))
	for _, actor := range []string{"operator-a", "operator-b"} {
		if err := f.s.Approve(ctx, trade.TradeID, f.proof(t, trade.RFQTradeIntent, actor)); err != nil {
			t.Fatal(err)
		}
	}
	// Force a database failure while posting the second asset. The first asset
	// journal must roll back together with it, not consume the user's reserve.
	_, err := f.s.Store.DB.Exec(ctx, `CREATE FUNCTION fail_rfq_buy_leg() RETURNS TRIGGER LANGUAGE plpgsql AS $$
	 BEGIN IF NEW.ref LIKE 'rfq-settled-buy:%' THEN RAISE EXCEPTION 'injected buy-leg failure'; END IF; RETURN NEW; END $$;
	 CREATE TRIGGER fail_rfq_buy_leg BEFORE INSERT ON journals FOR EACH ROW EXECUTE FUNCTION fail_rfq_buy_leg()`)
	if err != nil {
		t.Fatal(err)
	}
	if err = f.s.Process(ctx, trade.TradeID, false); err == nil {
		t.Fatal("injected settlement failure did not occur")
	}
	if b := f.balance(t, rfq.ETH); b.Available != "0" || b.Frozen != "1000000000000000000" {
		t.Fatal("sell reserve changed after rollback", b)
	}
	if b := f.balance(t, rfq.USD); b.Available != "0" {
		t.Fatal("buy asset credited after rollback", b)
	}
	var count int
	if err = f.s.Store.DB.QueryRow(ctx, `SELECT count(*) FROM journals WHERE ref LIKE 'rfq-settled-%'`).Scan(&count); err != nil || count != 0 {
		t.Fatal("partial journal persisted", count, err)
	}
	if _, err = f.s.Store.DB.Exec(ctx, `DROP TRIGGER fail_rfq_buy_leg ON journals; DROP FUNCTION fail_rfq_buy_leg()`); err != nil {
		t.Fatal(err)
	}
	restarted := &rfq.Service{Store: f.s.Store, Approvers: f.s.Approvers}
	if err = restarted.Process(ctx, trade.TradeID, false); err != nil {
		t.Fatal("recovery failed", err)
	}
	if b := f.balance(t, rfq.USD); b.Available != trade.Quote.BuyAmount {
		t.Fatal(b)
	}
	// Exercise the reverse pair and 6-to-18 decimal conversion with actual funds.
	quotes, err := f.s.Request(ctx, domain.RFQRequest{UserID: f.user, Network: "evm-dev", SellAsset: rfq.USD, BuyAsset: rfq.ETH, SellAmount: "100000000"})
	if err != nil {
		t.Fatal(err)
	}
	reverse := f.accept(t, quotes.Quotes[0])
	for _, actor := range []string{"operator-a", "operator-b"} {
		if err = f.s.Approve(ctx, reverse.TradeID, f.proof(t, reverse.RFQTradeIntent, actor)); err != nil {
			t.Fatal(err)
		}
	}
	if err = f.s.Process(ctx, reverse.TradeID, false); err != nil {
		t.Fatal(err)
	}
	if b := f.balance(t, rfq.ETH); b.Available != reverse.Quote.BuyAmount || b.Frozen != "0" {
		t.Fatal("reverse trade balance", b)
	}
}

func TestRFQHTTPQuoteConfirmApproveSettle(t *testing.T) {
	f := setup(t, "1000000000000000000")
	ctx := context.Background()
	server := httptest.NewServer((&httpapi.API{Service: &service.Service{Store: f.s.Store}, RFQ: f.s, Token: "rfq-http-test"}).Handler())
	defer server.Close()
	call := func(method, path string, body any, key string, expected int, out any) {
		t.Helper()
		raw, _ := json.Marshal(body)
		req, err := http.NewRequest(method, server.URL+path, bytes.NewReader(raw))
		if err != nil {
			t.Fatal(err)
		}
		req.Header.Set("Authorization", "Bearer rfq-http-test")
		req.Header.Set("Idempotency-Key", key)
		res, err := server.Client().Do(req)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		if res.StatusCode != expected {
			raw, _ = io.ReadAll(res.Body)
			t.Fatalf("%s: %d %s", path, res.StatusCode, raw)
		}
		if out != nil {
			if err = json.NewDecoder(res.Body).Decode(out); err != nil {
				t.Fatal(err)
			}
		}
	}
	var quotes domain.RFQResult
	call("POST", "/v1/rfq/quotes", request(f.user, "1000000000000000000"), "", 200, &quotes)
	var trade domain.RFQTrade
	call("POST", "/v1/rfq/trades", domain.RFQAccept{UserID: f.user, QuoteID: quotes.BestID, MinBuyAmount: quotes.Quotes[0].BuyAmount}, "http-confirm", 201, &trade)
	for _, actor := range []string{"operator-a", "operator-b"} {
		call("POST", "/v1/rfq/trades/"+trade.TradeID+"/approvals", f.proof(t, trade.RFQTradeIntent, actor), "", 200, nil)
	}
	if err := f.s.Process(ctx, trade.TradeID, false); err != nil {
		t.Fatal(err)
	}
	call("GET", "/v1/rfq/trades/"+trade.TradeID, nil, "", 200, &trade)
	if trade.State != "settled" || f.balance(t, rfq.USD).Available != trade.Quote.BuyAmount {
		t.Fatal("HTTP settlement failed", trade)
	}
}
