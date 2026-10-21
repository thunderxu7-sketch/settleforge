package domain

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"math/big"
	"regexp"
	"time"
)

var (
	ErrInvalid  = errors.New("invalid input")
	ErrNotFound = errors.New("not found")
	ErrConflict = errors.New("conflicting request")
	ErrFunds    = errors.New("insufficient funds")
	ErrState    = errors.New("operation not allowed in current state")
	ErrApproval = errors.New("invalid approval")
)

var unitsPattern = regexp.MustCompile(`^[1-9][0-9]{0,77}$`)

// Units are integer base units throughout the service. Floats are never accepted.
func Units(s string) (*big.Int, error) {
	if !unitsPattern.MatchString(s) {
		return nil, ErrInvalid
	}
	n, ok := new(big.Int).SetString(s, 10)
	if !ok || n.BitLen() > 256 {
		return nil, ErrInvalid
	}
	return n, nil
}

func Hash(v any) string {
	b, _ := json.Marshal(v)
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:])
}

type Asset struct {
	ID       string `json:"id"`
	Network  string `json:"network"`
	Symbol   string `json:"symbol"`
	Decimals int    `json:"decimals"`
	Contract string `json:"contract,omitempty"`
}

type Wallet struct {
	ID      string `json:"id"`
	UserID  string `json:"user_id,omitempty"`
	Network string `json:"network"`
	Address string `json:"address"`
	KeyRef  string `json:"-"`
	Purpose string `json:"purpose"`
}

type Intent struct {
	ID          string `json:"id"`
	Kind        string `json:"kind"`
	WalletID    string `json:"wallet_id"`
	UserID      string `json:"user_id"`
	Asset       string `json:"asset"`
	Network     string `json:"network"`
	Destination string `json:"destination"`
	Amount      string `json:"amount"`
	FeeCap      string `json:"fee_cap"`
	ExpiresAt   int64  `json:"expires_at"`
}

type Approval struct {
	Actor     string `json:"actor"`
	Signature string `json:"signature"`
}

type Withdrawal struct {
	Intent
	State       string    `json:"state"`
	Fingerprint string    `json:"fingerprint"`
	TxID        string    `json:"txid,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type Balance struct {
	Asset     string `json:"asset"`
	Available string `json:"available"`
	Frozen    string `json:"frozen"`
}

type Deposit struct {
	Network   string `json:"network"`
	TxID      string `json:"txid"`
	Index     int    `json:"index"`
	BlockHash string `json:"block_hash"`
	Height    int64  `json:"height"`
	WalletID  string `json:"wallet_id"`
	Asset     string `json:"asset"`
	Amount    string `json:"amount"`
	Confirmed bool   `json:"confirmed"`
}

type Line struct{ Account, Amount string }

type Receipt struct {
	Found     bool   `json:"found"`
	Confirmed bool   `json:"confirmed"`
	Success   bool   `json:"success"`
	Fee       string `json:"fee"`
	BlockHash string `json:"block_hash"`
	Height    int64  `json:"height"`
}

type Prepared struct {
	Network  string          `json:"network"`
	WalletID string          `json:"wallet_id"`
	KeyRef   string          `json:"key_ref"`
	Intent   Intent          `json:"intent"`
	Payload  json.RawMessage `json:"payload"`
}

type Signed struct {
	TxID string          `json:"txid"`
	Raw  json.RawMessage `json:"raw"`
}
