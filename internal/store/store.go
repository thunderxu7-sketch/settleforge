package store

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
)

//go:embed schema.sql
var schema string

type Store struct{ DB *pgxpool.Pool }

func Open(ctx context.Context, url string) (*Store, error) {
	p, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, err
	}
	if err = p.Ping(ctx); err != nil {
		p.Close()
		return nil, err
	}
	return &Store{DB: p}, nil
}
func (s *Store) Migrate(ctx context.Context) error { _, err := s.DB.Exec(ctx, schema); return err }
func (s *Store) Close()                            { s.DB.Close() }
func translate(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	var p *pgconn.PgError
	if errors.As(err, &p) && (p.Code == "23505" || p.Code == "23503") {
		return domain.ErrConflict
	}
	return err
}
func transaction(ctx context.Context, db *pgxpool.Pool, fn func(pgx.Tx) error) error {
	tx, err := db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if err = fn(tx); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
func (s *Store) Seed(ctx context.Context) error {
	return transaction(ctx, s.DB, func(tx pgx.Tx) error {
		_, err := tx.Exec(ctx, `INSERT INTO networks(id,family,native_asset,confirmations) VALUES
		 ('tron-nile','tron','tron-nile/TRX',1),('evm-dev','evm','evm-dev/ETH',2),('btc-regtest','bitcoin','btc-regtest/BTC',2)
		 ON CONFLICT DO NOTHING;
		 INSERT INTO assets(id,network,symbol,decimals) VALUES
		 ('tron-nile/TRX','tron-nile','TRX',6),('evm-dev/ETH','evm-dev','ETH',18),('btc-regtest/BTC','btc-regtest','BTC',8)
		 ON CONFLICT DO NOTHING;`)
		return err
	})
}
func (s *Store) CreateUser(ctx context.Context, ref string) (string, error) {
	if len(ref) < 1 || len(ref) > 100 {
		return "", domain.ErrInvalid
	}
	var id string
	err := s.DB.QueryRow(ctx, `INSERT INTO users(external_ref) VALUES($1) RETURNING id`, ref).Scan(&id)
	return id, translate(err)
}
func (s *Store) Assets(ctx context.Context) ([]domain.Asset, error) {
	rows, err := s.DB.Query(ctx, `SELECT id,network,symbol,decimals,contract FROM assets ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.Asset{}
	for rows.Next() {
		var a domain.Asset
		if err = rows.Scan(&a.ID, &a.Network, &a.Symbol, &a.Decimals, &a.Contract); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}
func (s *Store) AddWallet(ctx context.Context, w domain.Wallet) (domain.Wallet, error) {
	err := s.DB.QueryRow(ctx, `INSERT INTO wallets(user_id,network,address,key_ref,purpose) VALUES(NULLIF($1,'')::uuid,$2,$3,$4,$5) RETURNING id`, w.UserID, w.Network, w.Address, w.KeyRef, w.Purpose).Scan(&w.ID)
	return w, translate(err)
}
func (s *Store) Wallets(ctx context.Context) ([]domain.Wallet, error) {
	rows, err := s.DB.Query(ctx, `SELECT id,COALESCE(user_id::text,''),network,address,key_ref,purpose FROM wallets ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.Wallet{}
	for rows.Next() {
		var w domain.Wallet
		if err = rows.Scan(&w.ID, &w.UserID, &w.Network, &w.Address, &w.KeyRef, &w.Purpose); err != nil {
			return nil, err
		}
		out = append(out, w)
	}
	return out, rows.Err()
}
func (s *Store) Wallet(ctx context.Context, id string) (domain.Wallet, error) {
	var w domain.Wallet
	err := s.DB.QueryRow(ctx, `SELECT id,COALESCE(user_id::text,''),network,address,key_ref,purpose FROM wallets WHERE id=$1`, id).Scan(&w.ID, &w.UserID, &w.Network, &w.Address, &w.KeyRef, &w.Purpose)
	return w, translate(err)
}
func accountKind(code string) string {
	if len(code) > 5 && code[:5] == "user:" {
		return "liability"
	}
	if len(code) > 7 && code[:7] == "wallet:" {
		return "asset"
	}
	if code == "network-fees" {
		return "expense"
	}
	return "equity"
}
func post(ctx context.Context, tx pgx.Tx, asset, ref string, lines ...domain.Line) error {
	if len(lines) < 2 {
		return domain.ErrInvalid
	}
	sum := new(big.Int)
	for _, l := range lines {
		n, ok := new(big.Int).SetString(l.Amount, 10)
		if !ok || n.Sign() == 0 {
			return domain.ErrInvalid
		}
		sum.Add(sum, n)
	}
	if sum.Sign() != 0 {
		return fmt.Errorf("%w: unbalanced posting", domain.ErrInvalid)
	}
	var jid string
	fp := domain.Hash(struct {
		Asset string
		Lines []domain.Line
	}{asset, lines})
	err := tx.QueryRow(ctx, `INSERT INTO journals(asset,ref,fingerprint) VALUES($1,$2,$3) ON CONFLICT(ref) DO NOTHING RETURNING id`, asset, ref, fp).Scan(&jid)
	if errors.Is(err, pgx.ErrNoRows) {
		var old string
		if err = tx.QueryRow(ctx, `SELECT fingerprint FROM journals WHERE ref=$1`, ref).Scan(&old); err != nil {
			return err
		}
		if old != fp {
			return domain.ErrConflict
		}
		return nil
	}
	if err != nil {
		return err
	}
	for _, l := range lines {
		var aid string
		err = tx.QueryRow(ctx, `INSERT INTO accounts(asset,code,kind) VALUES($1,$2,$3) ON CONFLICT(asset,code) DO UPDATE SET code=excluded.code RETURNING id`, asset, l.Account, accountKind(l.Account)).Scan(&aid)
		if err != nil {
			return err
		}
		if _, err = tx.Exec(ctx, `INSERT INTO entries(journal_id,account_id,asset,amount) VALUES($1,$2,$3,$4::numeric)`, jid, aid, asset, l.Amount); err != nil {
			return err
		}
	}
	return nil
}
func naturalBalance(ctx context.Context, q interface {
	QueryRow(context.Context, string, ...any) pgx.Row
}, asset, code string) (*big.Int, error) {
	var val string
	err := q.QueryRow(ctx, `SELECT COALESCE(sum(e.amount),0)::text FROM accounts a LEFT JOIN entries e ON e.account_id=a.id WHERE a.asset=$1 AND a.code=$2`, asset, code).Scan(&val)
	if err != nil {
		return nil, err
	}
	n, ok := new(big.Int).SetString(val, 10)
	if !ok {
		return nil, domain.ErrInvalid
	}
	return n, nil
}
func (s *Store) Balances(ctx context.Context, user string) ([]domain.Balance, error) {
	assets, err := s.Assets(ctx)
	if err != nil {
		return nil, err
	}
	out := []domain.Balance{}
	for _, a := range assets {
		av, e := naturalBalance(ctx, s.DB, a.ID, "user:"+user+":available")
		if e != nil {
			return nil, e
		}
		fr, e := naturalBalance(ctx, s.DB, a.ID, "user:"+user+":frozen")
		if e != nil {
			return nil, e
		}
		out = append(out, domain.Balance{Asset: a.ID, Available: av.Neg(av).String(), Frozen: fr.Neg(fr).String()})
	}
	return out, nil
}
func (s *Store) Capital(ctx context.Context, wallet, asset, amount, ref string) error {
	if _, err := domain.Units(amount); err != nil {
		return err
	}
	return transaction(ctx, s.DB, func(tx pgx.Tx) error {
		var net string
		if err := tx.QueryRow(ctx, `SELECT w.network FROM wallets w JOIN assets a ON a.network=w.network WHERE w.id=$1 AND a.id=$2`, wallet, asset).Scan(&net); err != nil {
			return translate(err)
		}
		return post(ctx, tx, asset, "capital:"+ref, domain.Line{Account: "wallet:" + wallet, Amount: amount}, domain.Line{Account: "platform-capital", Amount: "-" + amount})
	})
}
func (s *Store) Observe(ctx context.Context, d domain.Deposit) error {
	if _, err := domain.Units(d.Amount); err != nil {
		return err
	}
	if d.TxID == "" || d.BlockHash == "" || d.Height < 0 || d.Index < 0 {
		return domain.ErrInvalid
	}
	return transaction(ctx, s.DB, func(tx pgx.Tx) error {
		var user, net, assetnet string
		err := tx.QueryRow(ctx, `SELECT COALESCE(w.user_id::text,''),w.network,a.network FROM wallets w CROSS JOIN assets a WHERE w.id=$1 AND a.id=$2 FOR UPDATE OF w`, d.WalletID, d.Asset).Scan(&user, &net, &assetnet)
		if err != nil {
			return translate(err)
		}
		if user == "" || net != d.Network || net != assetnet {
			return domain.ErrInvalid
		}
		if _, err = tx.Exec(ctx, `SELECT id FROM users WHERE id=$1 FOR UPDATE`, user); err != nil {
			return err
		}
		var id, amount, wallet, asset, hash, state string
		var generation int
		err = tx.QueryRow(ctx, `INSERT INTO deposits(network,txid,event_index,block_hash,height,wallet_id,asset,amount,state) VALUES($1,$2,$3,$4,$5,$6,$7,$8::numeric,'observed') ON CONFLICT(network,txid,event_index) DO UPDATE SET txid=excluded.txid RETURNING id,amount::text,wallet_id,asset,block_hash,state,generation`, d.Network, d.TxID, d.Index, d.BlockHash, d.Height, d.WalletID, d.Asset, d.Amount).Scan(&id, &amount, &wallet, &asset, &hash, &state, &generation)
		if err != nil {
			return err
		}
		if amount != d.Amount || wallet != d.WalletID || asset != d.Asset || (hash != d.BlockHash && state != "orphaned") {
			return domain.ErrConflict
		}
		if !d.Confirmed || state == "credited" {
			return nil
		}
		if state == "orphaned" {
			generation++
			if _, err = tx.Exec(ctx, `UPDATE deposits SET state='observed',block_hash=$2,height=$3,generation=$4 WHERE id=$1`, id, d.BlockHash, d.Height, generation); err != nil {
				return err
			}
		}
		if err = post(ctx, tx, d.Asset, fmt.Sprintf("deposit:%s:%d", id, generation), domain.Line{Account: "wallet:" + d.WalletID, Amount: d.Amount}, domain.Line{Account: "user:" + user + ":available", Amount: "-" + d.Amount}); err != nil {
			return err
		}
		_, err = tx.Exec(ctx, `UPDATE deposits SET state='credited' WHERE id=$1`, id)
		return err
	})
}

func (s *Store) CreateWithdrawal(ctx context.Context, intent domain.Intent, key string) (domain.Withdrawal, bool, error) {
	intent.Kind = "withdrawal"
	return s.createOperation(ctx, intent, key)
}
func (s *Store) CreateSweep(ctx context.Context, intent domain.Intent, key string) (domain.Withdrawal, bool, error) {
	intent.Kind = "sweep"
	return s.createOperation(ctx, intent, key)
}
func (s *Store) createOperation(ctx context.Context, intent domain.Intent, key string) (domain.Withdrawal, bool, error) {
	if _, err := domain.Units(intent.Amount); err != nil {
		return domain.Withdrawal{}, false, err
	}
	if _, err := domain.Units(intent.FeeCap); err != nil {
		return domain.Withdrawal{}, false, err
	}
	if len(key) < 1 || len(key) > 100 || intent.ExpiresAt < time.Now().Unix() || intent.ExpiresAt > time.Now().Add(24*time.Hour).Unix() {
		return domain.Withdrawal{}, false, domain.ErrInvalid
	}
	// The client cannot choose business IDs. Replay compares the original semantics.
	intent.ID = ""
	fingerprint := domain.Hash(intent)
	var out domain.Withdrawal
	created := false
	err := transaction(ctx, s.DB, func(tx pgx.Tx) error {
		var state string
		if err := tx.QueryRow(ctx, `SELECT state FROM users WHERE id=$1 FOR UPDATE`, intent.UserID).Scan(&state); err != nil {
			return translate(err)
		}
		var original []byte
		var originalFP string
		err := tx.QueryRow(ctx, `SELECT intent_json,fingerprint,state,created_at FROM withdrawals WHERE user_id=$1 AND idempotency_key=$2`, intent.UserID, key).Scan(&original, &originalFP, &out.State, &out.CreatedAt)
		if err == nil {
			if originalFP != fingerprint {
				return domain.ErrConflict
			}
			out.Fingerprint = originalFP
			return json.Unmarshal(original, &out.Intent)
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		if state != "active" {
			return domain.ErrState
		}
		var network string
		var enabled bool
		if err = tx.QueryRow(ctx, `SELECT a.network,n.enabled FROM assets a JOIN networks n ON n.id=a.network WHERE a.id=$1`, intent.Asset).Scan(&network, &enabled); err != nil {
			return translate(err)
		}
		if !enabled || network != intent.Network {
			return domain.ErrInvalid
		}
		var purpose, owner, walletnet string
		if err = tx.QueryRow(ctx, `SELECT purpose,COALESCE(user_id::text,''),network FROM wallets WHERE id=$1`, intent.WalletID).Scan(&purpose, &owner, &walletnet); err != nil {
			return translate(err)
		}
		if walletnet != network {
			return domain.ErrInvalid
		}
		if intent.Kind == "withdrawal" && purpose != "treasury" {
			return domain.ErrState
		}
		code := "user:" + intent.UserID + ":available"
		if intent.Kind == "sweep" {
			if owner != intent.UserID || purpose != "deposit" {
				return domain.ErrState
			}
			code = "wallet:" + intent.WalletID
			var ok bool
			if err = tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM wallets WHERE network=$1 AND address=$2 AND purpose='treasury')`, network, intent.Destination).Scan(&ok); err != nil {
				return err
			}
			if !ok {
				return domain.ErrInvalid
			}
		}
		balance, err := naturalBalance(ctx, tx, intent.Asset, code)
		if err != nil {
			return err
		}
		if intent.Kind == "withdrawal" {
			balance.Neg(balance)
		}
		n, _ := domain.Units(intent.Amount)
		if balance.Cmp(n) < 0 {
			return domain.ErrFunds
		}
		if intent.Kind == "sweep" {
			var busy bool
			if err = tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM withdrawals WHERE wallet_id=$1 AND kind='sweep' AND state NOT IN ('confirmed','failed'))`, intent.WalletID).Scan(&busy); err != nil {
				return err
			}
			if busy {
				return domain.ErrState
			}
		}
		intent.ID = uuid.NewString()
		payload, _ := json.Marshal(intent)
		err = tx.QueryRow(ctx, `INSERT INTO withdrawals(id,user_id,asset,network,destination,amount,fee_cap,expires_at,idempotency_key,fingerprint,intent_json,state,kind,wallet_id) VALUES($1,$2,$3,$4,$5,$6::numeric,$7::numeric,$8,$9,$10,$11,'pending_approval',$12,$13) RETURNING created_at`, intent.ID, intent.UserID, intent.Asset, intent.Network, intent.Destination, intent.Amount, intent.FeeCap, intent.ExpiresAt, key, fingerprint, payload, intent.Kind, intent.WalletID).Scan(&out.CreatedAt)
		if err != nil {
			return err
		}
		if intent.Kind == "withdrawal" {
			err = post(ctx, tx, intent.Asset, "freeze:"+intent.ID, domain.Line{Account: "user:" + intent.UserID + ":available", Amount: intent.Amount}, domain.Line{Account: "user:" + intent.UserID + ":frozen", Amount: "-" + intent.Amount})
			if err != nil {
				return err
			}
		}
		out.Intent = intent
		out.State = "pending_approval"
		out.Fingerprint = fingerprint
		created = true
		return nil
	})
	return out, created, translate(err)
}
func (s *Store) Withdrawal(ctx context.Context, id string) (domain.Withdrawal, error) {
	var w domain.Withdrawal
	var body []byte
	err := s.DB.QueryRow(ctx, `SELECT intent_json,state,fingerprint,created_at,COALESCE((SELECT txid FROM attempts WHERE withdrawal_id=w.id),'') FROM withdrawals w WHERE id=$1`, id).Scan(&body, &w.State, &w.Fingerprint, &w.CreatedAt, &w.TxID)
	if err != nil {
		return w, translate(err)
	}
	err = json.Unmarshal(body, &w.Intent)
	return w, err
}
func (s *Store) AddApproval(ctx context.Context, id string, a domain.Approval, quorum int) error {
	return transaction(ctx, s.DB, func(tx pgx.Tx) error {
		var state string
		if err := tx.QueryRow(ctx, `SELECT state FROM withdrawals WHERE id=$1 FOR UPDATE`, id).Scan(&state); err != nil {
			return translate(err)
		}
		if state != "pending_approval" && state != "approved" {
			return domain.ErrState
		}
		_, err := tx.Exec(ctx, `INSERT INTO approvals(withdrawal_id,actor,signature) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`, id, a.Actor, a.Signature)
		if err != nil {
			return err
		}
		var count int
		if err = tx.QueryRow(ctx, `SELECT count(*) FROM approvals WHERE withdrawal_id=$1`, id).Scan(&count); err != nil {
			return err
		}
		if count >= quorum {
			if _, err = tx.Exec(ctx, `UPDATE withdrawals SET state='approved' WHERE id=$1`, id); err != nil {
				return err
			}
			_, err = tx.Exec(ctx, `INSERT INTO jobs(withdrawal_id) VALUES($1) ON CONFLICT DO NOTHING`, id)
		}
		return err
	})
}
