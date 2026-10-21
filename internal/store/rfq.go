package store

import (
	"bytes"
	"context"
	"crypto/ed25519"
	"encoding/json"
	"errors"
	"math/big"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
)

func makerAccount(id, state string) string { return "user:rfq-maker:" + id + ":" + state }
func userAccount(id, state string) string  { return "user:" + id + ":" + state }

func rfqGross(q domain.RFQQuote) string {
	n, _ := new(big.Int).SetString(q.BuyAmount, 10)
	f, _ := new(big.Int).SetString(q.FeeAmount, 10)
	return n.Add(n, f).String()
}

func (s *Store) InitRFQLab(ctx context.Context) error {
	_, err := s.DB.Exec(ctx, `INSERT INTO assets(id,network,symbol,decimals,contract)
	 VALUES('evm-dev/LABUSD','evm-dev','LABUSD',6,'rfq-lab-only-not-an-erc20') ON CONFLICT DO NOTHING`)
	return err
}

func (s *Store) RegisterRFQMaker(ctx context.Context, id string, key ed25519.PublicKey) error {
	if id == "" || len(key) != ed25519.PublicKeySize {
		return domain.ErrInvalid
	}
	_, err := s.DB.Exec(ctx, `INSERT INTO rfq_makers(id,public_key,mode) VALUES($1,$2,'local-simulated') ON CONFLICT DO NOTHING`, id, []byte(key))
	if err != nil {
		return err
	}
	var old []byte
	if err = s.DB.QueryRow(ctx, `SELECT public_key FROM rfq_makers WHERE id=$1`, id).Scan(&old); err != nil {
		return err
	}
	if !bytes.Equal(old, key) {
		return domain.ErrConflict // Never silently rotate a pinned maker key.
	}
	return nil
}

// FundRFQLabMaker is only used when the explicit RFQ lab is enabled. Its assets
// live in a separate simulated inventory account, not a chain wallet account.
func (s *Store) FundRFQLabMaker(ctx context.Context, maker, asset, amount string) error {
	if _, err := domain.Units(amount); err != nil {
		return err
	}
	if asset != "evm-dev/ETH" && asset != "evm-dev/LABUSD" {
		return domain.ErrInvalid
	}
	return transaction(ctx, s.DB, func(tx pgx.Tx) error {
		return post(ctx, tx, asset, "rfq-lab-capital:"+maker+":"+asset,
			domain.Line{Account: "rfq-lab-inventory:" + maker, Amount: amount},
			domain.Line{Account: makerAccount(maker, "available"), Amount: "-" + amount})
	})
}

func (s *Store) SaveRFQQuotes(ctx context.Context, quotes []domain.RFQQuote) error {
	return transaction(ctx, s.DB, func(tx pgx.Tx) error {
		for _, q := range quotes {
			raw, err := json.Marshal(q)
			if err != nil {
				return err
			}
			_, err = tx.Exec(ctx, `INSERT INTO rfq_quotes(id,request_id,user_id,maker_id,expires_at,quote_json,fingerprint) VALUES($1,$2,$3,$4,$5,$6,$7)`, q.QuoteID, q.ID, q.UserID, q.MakerID, q.ExpiresAt, raw, domain.Hash(q))
			if err != nil {
				return translate(err)
			}
		}
		return nil
	})
}

func (s *Store) RFQQuote(ctx context.Context, id string) (domain.RFQQuote, error) {
	var raw []byte
	err := s.DB.QueryRow(ctx, `SELECT quote_json FROM rfq_quotes WHERE id=$1`, id).Scan(&raw)
	var q domain.RFQQuote
	if err != nil {
		return q, translate(err)
	}
	err = json.Unmarshal(raw, &q)
	return q, err
}

func (s *Store) RFQUserActive(ctx context.Context, id string) error {
	var state string
	if err := s.DB.QueryRow(ctx, `SELECT state FROM users WHERE id=$1`, id).Scan(&state); err != nil {
		return translate(err)
	}
	if state != "active" {
		return domain.ErrState
	}
	return nil
}

func scanRFQTrade(row pgx.Row) (domain.RFQTrade, error) {
	var t domain.RFQTrade
	var raw []byte
	err := row.Scan(&raw, &t.State, &t.CreatedAt)
	if err != nil {
		return t, translate(err)
	}
	err = json.Unmarshal(raw, &t.RFQTradeIntent)
	return t, err
}

func (s *Store) RFQTrade(ctx context.Context, id string) (domain.RFQTrade, error) {
	return scanRFQTrade(s.DB.QueryRow(ctx, `SELECT intent_json,state,created_at FROM rfq_trades WHERE id=$1`, id))
}

func (s *Store) AcceptRFQ(ctx context.Context, in domain.RFQAccept, key string, verify func(domain.RFQQuote, ed25519.PublicKey) error) (domain.RFQTrade, bool, error) {
	var out domain.RFQTrade
	created := false
	fp := domain.Hash(in)
	err := transaction(ctx, s.DB, func(tx pgx.Tx) error {
		var userState string
		if err := tx.QueryRow(ctx, `SELECT state FROM users WHERE id=$1 FOR UPDATE`, in.UserID).Scan(&userState); err != nil {
			return translate(err)
		}
		var oldFP string
		err := tx.QueryRow(ctx, `SELECT fingerprint FROM rfq_trades WHERE user_id=$1 AND idempotency_key=$2`, in.UserID, key).Scan(&oldFP)
		if err == nil {
			if fp != oldFP {
				return domain.ErrConflict
			}
			out, err = scanRFQTrade(tx.QueryRow(ctx, `SELECT intent_json,state,created_at FROM rfq_trades WHERE user_id=$1 AND idempotency_key=$2`, in.UserID, key))
			return err // Replay still works after expiry or settlement.
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		if userState != "active" {
			return domain.ErrState
		}
		var raw []byte
		if err = tx.QueryRow(ctx, `SELECT quote_json FROM rfq_quotes WHERE id=$1 AND user_id=$2`, in.QuoteID, in.UserID).Scan(&raw); err != nil {
			return translate(err)
		}
		var q domain.RFQQuote
		if err = json.Unmarshal(raw, &q); err != nil {
			return err
		}
		var pub []byte
		var enabled bool
		if err = tx.QueryRow(ctx, `SELECT public_key,enabled FROM rfq_makers WHERE id=$1 FOR UPDATE`, q.MakerID).Scan(&pub, &enabled); err != nil {
			return translate(err)
		}
		if !enabled {
			return domain.ErrState
		}
		if err = verify(q, ed25519.PublicKey(pub)); err != nil {
			return err
		}
		var now int64
		if err = tx.QueryRow(ctx, `SELECT floor(extract(epoch FROM clock_timestamp()))::bigint`).Scan(&now); err != nil {
			return err
		}
		if q.ExpiresAt <= now {
			return domain.ErrState
		}
		min, err := domain.Units(in.MinBuyAmount)
		if err != nil {
			return err
		}
		net, _ := domain.Units(q.BuyAmount)
		if net.Cmp(min) < 0 {
			return domain.ErrInvalid
		}
		var permitted bool
		if err = tx.QueryRow(ctx, `SELECT count(*)=2 FROM assets a JOIN networks n ON n.id=a.network WHERE a.id IN ($1,$2) AND a.network=$3 AND n.enabled`, q.SellAsset, q.BuyAsset, q.Network).Scan(&permitted); err != nil {
			return err
		}
		if !permitted {
			return domain.ErrState
		}
		for _, reserve := range []struct{ asset, code, amount string }{
			{q.SellAsset, userAccount(in.UserID, "available"), q.SellAmount},
			{q.BuyAsset, makerAccount(q.MakerID, "available"), rfqGross(q)},
		} {
			balance, e := naturalBalance(ctx, tx, reserve.asset, reserve.code)
			if e != nil {
				return e
			}
			amount, _ := domain.Units(reserve.amount)
			if balance.Neg(balance).Cmp(amount) < 0 {
				return domain.ErrFunds
			}
		}
		out.RFQTradeIntent = domain.RFQTradeIntent{TradeID: uuid.NewString(), UserID: in.UserID, Quote: q, MinBuyAmount: in.MinBuyAmount}
		raw, _ = json.Marshal(out.RFQTradeIntent)
		if err = tx.QueryRow(ctx, `INSERT INTO rfq_trades(id,user_id,quote_id,maker_id,idempotency_key,fingerprint,intent_json,expires_at,state) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'pending_approval') RETURNING created_at`, out.TradeID, in.UserID, in.QuoteID, q.MakerID, key, fp, raw, q.ExpiresAt).Scan(&out.CreatedAt); err != nil {
			return translate(err)
		}
		if err = post(ctx, tx, q.SellAsset, "rfq-freeze-sell:"+out.TradeID,
			domain.Line{Account: userAccount(in.UserID, "available"), Amount: q.SellAmount},
			domain.Line{Account: userAccount(in.UserID, "frozen"), Amount: "-" + q.SellAmount}); err != nil {
			return err
		}
		if err = post(ctx, tx, q.BuyAsset, "rfq-freeze-buy:"+out.TradeID,
			domain.Line{Account: makerAccount(q.MakerID, "available"), Amount: rfqGross(q)},
			domain.Line{Account: makerAccount(q.MakerID, "frozen"), Amount: "-" + rfqGross(q)}); err != nil {
			return err
		}
		out.State, created = "pending_approval", true
		return auditRFQ(ctx, tx, out, "rfq.accept")
	})
	return out, created, translate(err)
}

func auditRFQ(ctx context.Context, tx pgx.Tx, t domain.RFQTrade, action string) error {
	_, err := tx.Exec(ctx, `INSERT INTO audit(actor,action,subject,detail) VALUES($1,$2,$3,$4)`, t.UserID, action, t.TradeID, `{"mode":"local-simulated"}`)
	return err
}

func (s *Store) AddRFQApproval(ctx context.Context, id string, proof domain.Approval) error {
	return transaction(ctx, s.DB, func(tx pgx.Tx) error {
		var state string
		var expired bool
		if err := tx.QueryRow(ctx, `SELECT state,expires_at<=floor(extract(epoch FROM clock_timestamp())) FROM rfq_trades WHERE id=$1 FOR UPDATE`, id).Scan(&state, &expired); err != nil {
			return translate(err)
		}
		if expired || (state != "pending_approval" && state != "approved") {
			return domain.ErrState
		}
		if _, err := tx.Exec(ctx, `INSERT INTO rfq_approvals(trade_id,actor,signature) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`, id, proof.Actor, proof.Signature); err != nil {
			return err
		}
		_, err := tx.Exec(ctx, `UPDATE rfq_trades SET state='approved' WHERE id=$1 AND (SELECT count(*) FROM rfq_approvals WHERE trade_id=$1)>=2`, id)
		return err
	})
}

// ProcessRFQ has no external side effect: both legs, fees, unfreezes and terminal
// state commit in ONE PostgreSQL transaction. A crash can only commit or roll
// back the whole exchange. External execution needs a separate durable outbox.
func (s *Store) ProcessRFQ(ctx context.Context, id string, cancel bool, verify func(domain.RFQTradeIntent, []domain.Approval, ed25519.PublicKey) error) error {
	initial, err := s.RFQTrade(ctx, id)
	if err != nil {
		return err
	}
	return transaction(ctx, s.DB, func(tx pgx.Tx) error {
		var userState string
		if err := tx.QueryRow(ctx, `SELECT state FROM users WHERE id=$1 FOR UPDATE`, initial.UserID).Scan(&userState); err != nil {
			return translate(err)
		}
		var pub []byte
		var enabled bool
		if err := tx.QueryRow(ctx, `SELECT public_key,enabled FROM rfq_makers WHERE id=$1 FOR UPDATE`, initial.Quote.MakerID).Scan(&pub, &enabled); err != nil {
			return err
		}
		t, err := scanRFQTrade(tx.QueryRow(ctx, `SELECT intent_json,state,created_at FROM rfq_trades WHERE id=$1 FOR UPDATE`, id))
		if err != nil {
			return err
		}
		if t.State == "settled" || t.State == "expired" || t.State == "cancelled" {
			return nil
		}
		var now int64
		if err = tx.QueryRow(ctx, `SELECT floor(extract(epoch FROM clock_timestamp()))::bigint`).Scan(&now); err != nil {
			return err
		}
		q := t.Quote
		target := "settled"
		if q.ExpiresAt <= now {
			target = "expired"
		} else if cancel {
			target = "cancelled"
		}
		if target == "settled" {
			if t.State != "approved" {
				return nil
			}
			if userState != "active" || !enabled {
				return domain.ErrState
			}
			rows, e := tx.Query(ctx, `SELECT actor,signature FROM rfq_approvals WHERE trade_id=$1 ORDER BY actor`, id)
			if e != nil {
				return e
			}
			proofs := []domain.Approval{}
			for rows.Next() {
				var proof domain.Approval
				if e = rows.Scan(&proof.Actor, &proof.Signature); e != nil {
					rows.Close()
					return e
				}
				proofs = append(proofs, proof)
			}
			rows.Close()
			if e = rows.Err(); e != nil {
				return e
			}
			if err = verify(t.RFQTradeIntent, proofs, ed25519.PublicKey(pub)); err != nil {
				return err
			}
		}
		sellTo, buyTo := makerAccount(q.MakerID, "available"), userAccount(t.UserID, "available")
		if target != "settled" {
			sellTo, buyTo = userAccount(t.UserID, "available"), makerAccount(q.MakerID, "available")
		}
		if err = post(ctx, tx, q.SellAsset, "rfq-"+target+"-sell:"+id,
			domain.Line{Account: userAccount(t.UserID, "frozen"), Amount: q.SellAmount},
			domain.Line{Account: sellTo, Amount: "-" + q.SellAmount}); err != nil {
			return err
		}
		lines := []domain.Line{{Account: makerAccount(q.MakerID, "frozen"), Amount: rfqGross(q)}}
		if target == "settled" {
			lines = append(lines, domain.Line{Account: buyTo, Amount: "-" + q.BuyAmount})
			if q.FeeAmount != "0" {
				lines = append(lines, domain.Line{Account: "rfq-fees", Amount: "-" + q.FeeAmount})
			}
		} else {
			lines = append(lines, domain.Line{Account: buyTo, Amount: "-" + rfqGross(q)})
		}
		if err = post(ctx, tx, q.BuyAsset, "rfq-"+target+"-buy:"+id, lines...); err != nil {
			return err
		}
		if _, err = tx.Exec(ctx, `UPDATE rfq_trades SET state=$2 WHERE id=$1`, id, target); err != nil {
			return err
		}
		return auditRFQ(ctx, tx, t, "rfq."+target)
	})
}

func (s *Store) PendingRFQ(ctx context.Context) ([]string, error) {
	rows, err := s.DB.Query(ctx, `SELECT id FROM rfq_trades WHERE state='approved' OR (state='pending_approval' AND expires_at<=floor(extract(epoch FROM clock_timestamp()))) ORDER BY expires_at LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []string{}
	for rows.Next() {
		var id string
		if err = rows.Scan(&id); err != nil {
			return nil, err
		}
		out = append(out, id)
	}
	return out, rows.Err()
}
