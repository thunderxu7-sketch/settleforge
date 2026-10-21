package store

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
)

type Job struct{ ID, WithdrawalID, Token string }

func (s *Store) UserActive(ctx context.Context, id string) (bool, error) {
	var state string
	err := s.DB.QueryRow(ctx, `SELECT state FROM users WHERE id=$1`, id).Scan(&state)
	return state == "active", translate(err)
}
func (s *Store) Claim(ctx context.Context) (Job, error) {
	var j Job
	err := s.DB.QueryRow(ctx, `WITH selected AS (SELECT id FROM jobs WHERE next_at<=now() AND (state='pending' OR (state='leased' AND lease_until<now())) ORDER BY next_at,id FOR UPDATE SKIP LOCKED LIMIT 1)
	 UPDATE jobs j SET state='leased',lease_until=now()+interval '30 seconds',lease_token=gen_random_uuid(),attempts=attempts+1 FROM selected WHERE j.id=selected.id RETURNING j.id,j.withdrawal_id,j.lease_token`).Scan(&j.ID, &j.WithdrawalID, &j.Token)
	return j, translate(err)
}
func (s *Store) Retry(ctx context.Context, j Job, cause error) error {
	message := ""
	if cause != nil {
		message = cause.Error()
		if len(message) > 300 {
			message = message[:300]
		}
	}
	_, err := s.DB.Exec(ctx, `UPDATE jobs SET state='pending',next_at=now()+interval '1 second',last_error=$3 WHERE id=$1 AND lease_token=$2 AND state='leased'`, j.ID, j.Token, message)
	return err
}
func (s *Store) Approvals(ctx context.Context, id string) ([]domain.Approval, error) {
	rows, err := s.DB.Query(ctx, `SELECT actor,signature FROM approvals WHERE withdrawal_id=$1 ORDER BY actor`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.Approval{}
	for rows.Next() {
		var a domain.Approval
		if err = rows.Scan(&a.Actor, &a.Signature); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}
func (s *Store) Attempt(ctx context.Context, id string) (domain.Prepared, *domain.Signed, error) {
	var p domain.Prepared
	var prepared, signed []byte
	err := s.DB.QueryRow(ctx, `SELECT prepared,signed FROM attempts WHERE withdrawal_id=$1`, id).Scan(&prepared, &signed)
	if err != nil {
		return p, nil, translate(err)
	}
	if err = json.Unmarshal(prepared, &p); err != nil {
		return p, nil, err
	}
	if len(signed) == 0 {
		return p, nil, nil
	}
	var out domain.Signed
	err = json.Unmarshal(signed, &out)
	return p, &out, err
}
func (s *Store) SavePrepared(ctx context.Context, p domain.Prepared) (domain.Prepared, error) {
	body, _ := json.Marshal(p)
	err := transaction(ctx, s.DB, func(tx pgx.Tx) error {
		var state string
		if err := tx.QueryRow(ctx, `SELECT state FROM withdrawals WHERE id=$1 FOR UPDATE`, p.Intent.ID).Scan(&state); err != nil {
			return err
		}
		if state == "confirmed" || state == "failed" || state == "review" {
			return domain.ErrState
		}
		_, err := tx.Exec(ctx, `INSERT INTO attempts(withdrawal_id,wallet_id,prepared) VALUES($1,$2,$3) ON CONFLICT(withdrawal_id) DO NOTHING`, p.Intent.ID, p.WalletID, body)
		if err != nil {
			return err
		}
		_, err = tx.Exec(ctx, `UPDATE withdrawals SET state='prepared' WHERE id=$1 AND state='approved'`, p.Intent.ID)
		return err
	})
	if err != nil {
		return p, err
	}
	out, _, err := s.Attempt(ctx, p.Intent.ID)
	return out, err
}
func (s *Store) SaveSigned(ctx context.Context, id string, signed domain.Signed) (domain.Signed, error) {
	body, _ := json.Marshal(signed)
	err := transaction(ctx, s.DB, func(tx pgx.Tx) error {
		var state string
		if err := tx.QueryRow(ctx, `SELECT state FROM withdrawals WHERE id=$1 FOR UPDATE`, id).Scan(&state); err != nil {
			return err
		}
		if state == "confirmed" || state == "failed" || state == "review" {
			return domain.ErrState
		}
		if _, err := tx.Exec(ctx, `UPDATE attempts SET txid=$2,signed=$3 WHERE withdrawal_id=$1 AND signed IS NULL`, id, signed.TxID, body); err != nil {
			return err
		}
		_, err := tx.Exec(ctx, `UPDATE withdrawals SET state='signed' WHERE id=$1`, id)
		return err
	})
	if err != nil {
		return signed, err
	}
	_, out, err := s.Attempt(ctx, id)
	if err != nil {
		return signed, err
	}
	return *out, nil
}
func (s *Store) BroadcastState(ctx context.Context, id string, unknown bool) error {
	state := "broadcast"
	if unknown {
		state = "broadcast_unknown"
	}
	_, err := s.DB.Exec(ctx, `UPDATE withdrawals SET state=$2 WHERE id=$1 AND state IN ('signed','broadcast','broadcast_unknown')`, id, state)
	return err
}
func (s *Store) Review(ctx context.Context, id, reason string) error {
	return transaction(ctx, s.DB, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `UPDATE withdrawals SET state='review' WHERE id=$1 AND state NOT IN ('confirmed','failed')`, id); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `UPDATE jobs SET state='done',last_error=$2 WHERE withdrawal_id=$1`, id, reason); err != nil {
			return err
		}
		_, err := tx.Exec(ctx, `INSERT INTO audit(actor,action,subject,detail) VALUES('worker','review',$1,jsonb_build_object('reason',$2::text))`, id, reason)
		return err
	})
}
func (s *Store) Settle(ctx context.Context, id string, r domain.Receipt) error {
	if !r.Found || !r.Confirmed {
		return domain.ErrState
	}
	fee, ok := new(big.Int).SetString(r.Fee, 10)
	if !ok || fee.Sign() < 0 || fee.BitLen() > 256 {
		return domain.ErrInvalid
	}
	return transaction(ctx, s.DB, func(tx pgx.Tx) error {
		var body []byte
		var state string
		if err := tx.QueryRow(ctx, `SELECT intent_json,state FROM withdrawals WHERE id=$1 FOR UPDATE`, id).Scan(&body, &state); err != nil {
			return err
		}
		if state == "confirmed" || state == "failed" {
			return nil
		}
		if state == "review" {
			return domain.ErrState
		}
		var i domain.Intent
		if err := json.Unmarshal(body, &i); err != nil {
			return err
		}
		var lock string
		if err := tx.QueryRow(ctx, `SELECT id FROM users WHERE id=$1 FOR UPDATE`, i.UserID).Scan(&lock); err != nil {
			return err
		}
		if i.Kind == "withdrawal" {
			destination := "wallet:" + i.WalletID
			if !r.Success {
				destination = "user:" + i.UserID + ":available"
			}
			if err := post(ctx, tx, i.Asset, "settle:"+id, domain.Line{Account: "user:" + i.UserID + ":frozen", Amount: i.Amount}, domain.Line{Account: destination, Amount: "-" + i.Amount}); err != nil {
				return err
			}
		} else if r.Success {
			var target string
			if err := tx.QueryRow(ctx, `SELECT id FROM wallets WHERE network=$1 AND address=$2 AND purpose='treasury'`, i.Network, i.Destination).Scan(&target); err != nil {
				return err
			}
			if err := post(ctx, tx, i.Asset, "settle:"+id, domain.Line{Account: "wallet:" + target, Amount: i.Amount}, domain.Line{Account: "wallet:" + i.WalletID, Amount: "-" + i.Amount}); err != nil {
				return err
			}
		}
		if fee.Sign() > 0 {
			var native string
			if err := tx.QueryRow(ctx, `SELECT native_asset FROM networks WHERE id=$1`, i.Network).Scan(&native); err != nil {
				return err
			}
			if err := post(ctx, tx, native, "fee:"+id, domain.Line{Account: "network-fees", Amount: fee.String()}, domain.Line{Account: "wallet:" + i.WalletID, Amount: "-" + fee.String()}); err != nil {
				return err
			}
		}
		final := "confirmed"
		if !r.Success {
			final = "failed"
		}
		if _, err := tx.Exec(ctx, `UPDATE withdrawals SET state=$2 WHERE id=$1`, id, final); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `UPDATE jobs SET state='done' WHERE withdrawal_id=$1`, id); err != nil {
			return err
		}
		_, err := tx.Exec(ctx, `INSERT INTO audit(actor,action,subject,detail) VALUES('worker',$2,$1,$3)`, id, final, body)
		return err
	})
}
func (s *Store) ReserveNonce(ctx context.Context, wallet, id string, onchain uint64) (uint64, error) {
	var nonce uint64
	err := transaction(ctx, s.DB, func(tx pgx.Tx) error {
		var network string
		if err := tx.QueryRow(ctx, `SELECT network FROM wallets WHERE id=$1 FOR UPDATE`, wallet).Scan(&network); err != nil {
			return err
		}
		err := tx.QueryRow(ctx, `SELECT nonce FROM nonce_reservations WHERE withdrawal_id=$1`, id).Scan(&nonce)
		if err == nil {
			return nil
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		var max int64
		if err = tx.QueryRow(ctx, `SELECT COALESCE(max(nonce),-1) FROM nonce_reservations WHERE wallet_id=$1`, wallet).Scan(&max); err != nil {
			return err
		}
		nonce = onchain
		if max >= 0 && uint64(max) >= nonce {
			nonce = uint64(max) + 1
		}
		_, err = tx.Exec(ctx, `INSERT INTO nonce_reservations(network,wallet_id,nonce,withdrawal_id) VALUES($1,$2,$3,$4)`, network, wallet, nonce, id)
		return err
	})
	return nonce, err
}

type AccountBalance struct {
	Asset  string `json:"asset"`
	Code   string `json:"code"`
	Kind   string `json:"kind"`
	Amount string `json:"amount"`
}

func (s *Store) Ledger(ctx context.Context) ([]AccountBalance, error) {
	rows, err := s.DB.Query(ctx, `SELECT a.asset,a.code,a.kind,COALESCE(sum(e.amount),0)::text FROM accounts a LEFT JOIN entries e ON e.account_id=a.id GROUP BY a.id ORDER BY a.asset,a.code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []AccountBalance{}
	for rows.Next() {
		var b AccountBalance
		if err = rows.Scan(&b.Asset, &b.Code, &b.Kind, &b.Amount); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}
func (s *Store) ReverseDeposit(ctx context.Context, network, hash string) error {
	return transaction(ctx, s.DB, func(tx pgx.Tx) error {
		rows, err := tx.Query(ctx, `SELECT d.id,d.asset,d.amount::text,d.wallet_id,w.user_id::text FROM deposits d JOIN wallets w ON w.id=d.wallet_id WHERE d.network=$1 AND d.block_hash=$2 AND d.state='credited' ORDER BY w.id,d.id`, network, hash)
		if err != nil {
			return err
		}
		type item struct{ ID, Asset, Amount, Wallet, User string }
		list := []item{}
		for rows.Next() {
			var x item
			if err = rows.Scan(&x.ID, &x.Asset, &x.Amount, &x.Wallet, &x.User); err != nil {
				rows.Close()
				return err
			}
			list = append(list, x)
		}
		err = rows.Err()
		rows.Close()
		if err != nil {
			return err
		}
		for _, x := range list {
			if _, err = tx.Exec(ctx, `SELECT id FROM wallets WHERE id=$1 FOR UPDATE`, x.Wallet); err != nil {
				return err
			}
			if _, err = tx.Exec(ctx, `SELECT id FROM users WHERE id=$1 FOR UPDATE`, x.User); err != nil {
				return err
			}
			var state string
			var generation int
			if err = tx.QueryRow(ctx, `SELECT state,generation FROM deposits WHERE id=$1 FOR UPDATE`, x.ID).Scan(&state, &generation); err != nil {
				return err
			}
			if state != "credited" {
				continue
			}
			if err = post(ctx, tx, x.Asset, fmt.Sprintf("reorg:%s:%d", x.ID, generation), domain.Line{Account: "user:" + x.User + ":available", Amount: x.Amount}, domain.Line{Account: "wallet:" + x.Wallet, Amount: "-" + x.Amount}); err != nil {
				return err
			}
			if _, err = tx.Exec(ctx, `UPDATE deposits SET state='orphaned' WHERE id=$1`, x.ID); err != nil {
				return err
			}
			if _, err = tx.Exec(ctx, `UPDATE users SET state='review' WHERE id=$1`, x.User); err != nil {
				return err
			}
		}
		_, err = tx.Exec(ctx, `UPDATE deposits SET state='orphaned' WHERE network=$1 AND block_hash=$2 AND state='observed'`, network, hash)
		return err
	})
}
func (s *Store) Expired(ctx context.Context, id string) bool {
	w, err := s.Withdrawal(ctx, id)
	return err != nil || time.Now().Unix() > w.ExpiresAt
}
