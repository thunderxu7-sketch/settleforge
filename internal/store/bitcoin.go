package store

import (
	"context"
	"encoding/hex"
	"github.com/jackc/pgx/v5"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
)

type UTXO struct {
	TxID   string
	Vout   uint32
	Amount int64
	Script []byte
}

// ReserveCoins serializes selection for one wallet. Reservations survive process
// failure and are never released merely because broadcast timed out.
func (s *Store) ReserveCoins(ctx context.Context, w domain.Wallet, id string, coins []UTXO, amount, cap, rate int64) ([]UTXO, int64, error) {
	var selected []UTXO
	var fee int64
	err := transaction(ctx, s.DB, func(tx pgx.Tx) error {
		var lock string
		if err := tx.QueryRow(ctx, `SELECT id FROM wallets WHERE id=$1 FOR UPDATE`, w.ID).Scan(&lock); err != nil {
			return err
		}
		rows, err := tx.Query(ctx, `SELECT txid,vout,amount,script FROM utxos WHERE reserved_by=$1 ORDER BY txid,vout`, id)
		if err != nil {
			return err
		}
		var total int64
		for rows.Next() {
			var u UTXO
			var script string
			if err = rows.Scan(&u.TxID, &u.Vout, &u.Amount, &script); err != nil {
				rows.Close()
				return err
			}
			u.Script, err = hex.DecodeString(script)
			if err != nil {
				rows.Close()
				return err
			}
			selected = append(selected, u)
			total += u.Amount
		}
		rows.Close()
		if rows.Err() != nil {
			return rows.Err()
		}
		if len(selected) == 0 {
			for _, u := range coins {
				if u.Amount <= 0 {
					return domain.ErrInvalid
				}
				if _, err = tx.Exec(ctx, `INSERT INTO utxos(network,txid,vout,wallet_id,amount,script) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`, w.Network, u.TxID, u.Vout, w.ID, u.Amount, hex.EncodeToString(u.Script)); err != nil {
					return err
				}
			}
			// Only use coins in the current confirmed RPC snapshot, even if older DB
			// records remain after an external spend or a reorganization.
			for _, u := range coins {
				var reserved *string
				if err = tx.QueryRow(ctx, `SELECT reserved_by FROM utxos WHERE network=$1 AND txid=$2 AND vout=$3 AND wallet_id=$4 FOR UPDATE`, w.Network, u.TxID, u.Vout, w.ID).Scan(&reserved); err != nil {
					return err
				}
				if reserved != nil {
					continue
				}
				selected = append(selected, u)
				total += u.Amount
				fee = rate * int64(12+69*len(selected)+86)
				if total >= amount+fee {
					break
				}
				if len(selected) >= 64 {
					return domain.ErrFunds
				}
			}
		}
		fee = rate * int64(12+69*len(selected)+86)
		if len(selected) == 0 || total < amount+fee {
			return domain.ErrFunds
		}
		if change := total - amount - fee; change > 0 && change < 330 {
			fee += change
		}
		if fee > cap {
			return domain.ErrInvalid
		}
		for _, u := range selected {
			if _, err = tx.Exec(ctx, `UPDATE utxos SET reserved_by=$4 WHERE network=$1 AND txid=$2 AND vout=$3 AND (reserved_by IS NULL OR reserved_by=$4)`, w.Network, u.TxID, u.Vout, id); err != nil {
				return err
			}
		}
		return nil
	})
	return selected, fee, err
}

func (s *Store) TransactionFee(ctx context.Context, txid string) (string, error) {
	var fee string
	err := s.DB.QueryRow(ctx, `SELECT signed->'raw'->>'fee' FROM attempts WHERE txid=$1`, txid).Scan(&fee)
	return fee, translate(err)
}
func (s *Store) ScanHead(ctx context.Context, network string) (int64, string, error) {
	var height int64
	var hash string
	err := s.DB.QueryRow(ctx, `SELECT height,block_hash FROM scans WHERE network=$1`, network).Scan(&height, &hash)
	if err == pgx.ErrNoRows {
		return 0, "", nil
	}
	return height, hash, err
}
func (s *Store) SaveScan(ctx context.Context, network string, height int64, hash string) error {
	return transaction(ctx, s.DB, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `INSERT INTO scanned_blocks(network,height,block_hash) VALUES($1,$2,$3) ON CONFLICT(network,height) DO UPDATE SET block_hash=EXCLUDED.block_hash`, network, height, hash); err != nil {
			return err
		}
		_, err := tx.Exec(ctx, `INSERT INTO scans(network,height,block_hash) VALUES($1,$2,$3) ON CONFLICT(network) DO UPDATE SET height=EXCLUDED.height,block_hash=EXCLUDED.block_hash`, network, height, hash)
		return err
	})
}
func (s *Store) ScannedHash(ctx context.Context, network string, height int64) (string, error) {
	var hash string
	err := s.DB.QueryRow(ctx, `SELECT block_hash FROM scanned_blocks WHERE network=$1 AND height=$2`, network, height).Scan(&hash)
	return hash, translate(err)
}
func (s *Store) QuarantineNetwork(ctx context.Context, network string) error {
	_, err := s.DB.Exec(ctx, `UPDATE users SET state='review' WHERE id IN(SELECT user_id FROM wallets WHERE network=$1)`, network)
	return err
}
func (s *Store) DepositBlocksAfter(ctx context.Context, network string, height int64) ([]string, error) {
	rows, err := s.DB.Query(ctx, `SELECT DISTINCT block_hash FROM deposits WHERE network=$1 AND height>$2 AND state!='orphaned'`, network, height)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []string{}
	for rows.Next() {
		var h string
		if err = rows.Scan(&h); err != nil {
			return nil, err
		}
		out = append(out, h)
	}
	return out, rows.Err()
}
