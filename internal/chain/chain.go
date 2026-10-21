package chain

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"math/big"
	"os"
	"path/filepath"
	"sync"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"github.com/thunderxu7-sketch/settleforge/internal/signing"
)

var ErrUnknown = errors.New("broadcast result unknown; retain reservation and query original transaction")

type Adapter interface {
	Build(context.Context, domain.Wallet, domain.Asset, domain.Intent) (domain.Prepared, error)
	Sign(context.Context, domain.Prepared, signing.Provider) (domain.Signed, error)
	Broadcast(context.Context, domain.Signed) error
	Receipt(context.Context, string) (domain.Receipt, error)
	Balance(context.Context, domain.Wallet, domain.Asset) (string, error)
}

// Simulator is labelled and isolated: it demonstrates recovery, not public-chain execution.
type Simulator struct {
	mu       sync.Mutex
	Path     string
	failNext bool
	State    simState
}
type simState struct {
	Balances  map[string]string      `json:"balances"`
	Transfers map[string]simTransfer `json:"transfers"`
	Credits   map[string]string      `json:"credits"`
	Height    int64                  `json:"height"`
}
type simTransfer struct {
	Prepared  domain.Prepared `json:"prepared"`
	Confirmed bool            `json:"confirmed"`
	Success   bool            `json:"success"`
	Fee       string          `json:"fee"`
}
type simPayload struct {
	Intent domain.Intent `json:"intent"`
	Sender string        `json:"sender"`
}

func OpenSimulator(path string) (*Simulator, error) {
	s := &Simulator{Path: path, State: simState{Balances: map[string]string{}, Transfers: map[string]simTransfer{}}}
	b, err := os.ReadFile(path)
	if err == nil {
		err = json.Unmarshal(b, &s.State)
	} else if os.IsNotExist(err) {
		err = nil
	}
	if s.State.Credits == nil {
		s.State.Credits = map[string]string{}
	}
	return s, err
}
func (s *Simulator) CreditOnce(wallet, asset, amount, ref string) error {
	n, err := domain.Units(amount)
	if err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	fp := domain.Hash([]string{wallet, asset, amount})
	if old, ok := s.State.Credits[ref]; ok {
		if old != fp {
			return domain.ErrConflict
		}
		return nil
	}
	key := wallet + ":" + asset
	old, _ := new(big.Int).SetString(s.State.Balances[key], 10)
	if old == nil {
		old = new(big.Int)
	}
	s.State.Balances[key] = old.Add(old, n).String()
	s.State.Credits[ref] = fp
	return s.save()
}
func (s *Simulator) save() error {
	if err := os.MkdirAll(filepath.Dir(s.Path), 0700); err != nil {
		return err
	}
	b, _ := json.Marshal(s.State)
	tmp := s.Path + ".tmp"
	if err := os.WriteFile(tmp, b, 0600); err != nil {
		return err
	}
	return os.Rename(tmp, s.Path)
}
func (s *Simulator) Credit(wallet, asset, amount string) error {
	n, err := domain.Units(amount)
	if err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	key := wallet + ":" + asset
	old, _ := new(big.Int).SetString(s.State.Balances[key], 10)
	if old == nil {
		old = new(big.Int)
	}
	s.State.Balances[key] = old.Add(old, n).String()
	return s.save()
}
func (s *Simulator) FailNextBroadcast() { s.mu.Lock(); defer s.mu.Unlock(); s.failNext = true }
func (s *Simulator) Build(ctx context.Context, w domain.Wallet, a domain.Asset, i domain.Intent) (domain.Prepared, error) {
	if err := ctx.Err(); err != nil {
		return domain.Prepared{}, err
	}
	if w.Network != a.Network || i.Network != w.Network || i.WalletID != w.ID || i.Asset != a.ID {
		return domain.Prepared{}, domain.ErrInvalid
	}
	if err := signing.ValidateAddress(i.Network, i.Destination); err != nil {
		return domain.Prepared{}, err
	}
	payload, _ := json.Marshal(simPayload{Intent: i, Sender: w.Address})
	return domain.Prepared{Network: i.Network, WalletID: w.ID, KeyRef: w.KeyRef, Intent: i, Payload: payload}, nil
}
func (s *Simulator) Sign(ctx context.Context, p domain.Prepared, provider signing.Provider) (domain.Signed, error) {
	var payload simPayload
	if err := json.Unmarshal(p.Payload, &payload); err != nil {
		return domain.Signed{}, err
	}
	if domain.Hash(payload.Intent) != domain.Hash(p.Intent) || p.Intent.WalletID != p.WalletID {
		return domain.Signed{}, domain.ErrInvalid
	}
	native := map[string]string{"tron-nile": "tron-nile/TRX", "evm-dev": "evm-dev/ETH", "btc-regtest": "btc-regtest/BTC"}
	if native[p.Network] == "" || p.Intent.Network != p.Network || p.Intent.Asset != native[p.Network] {
		return domain.Signed{}, domain.ErrInvalid
	}
	if p.Intent.Kind != "withdrawal" && p.Intent.Kind != "sweep" {
		return domain.Signed{}, domain.ErrInvalid
	}
	if err := signing.ValidateAddress(p.Network, p.Intent.Destination); err != nil {
		return domain.Signed{}, err
	}
	if _, err := domain.Units(p.Intent.Amount); err != nil {
		return domain.Signed{}, err
	}
	if _, err := domain.Units(p.Intent.FeeCap); err != nil {
		return domain.Signed{}, err
	}
	pub, err := provider.PublicKey(ctx, p.KeyRef)
	if err != nil {
		return domain.Signed{}, err
	}
	address, err := signing.Address(p.Network, pub)
	if err != nil || address != payload.Sender {
		return domain.Signed{}, domain.ErrInvalid
	}
	hash := sha256.Sum256(p.Payload)
	sig, err := provider.SignDigest(ctx, p.KeyRef, hash[:])
	if err != nil {
		return domain.Signed{}, err
	}
	if len(sig) != 65 || !crypto.VerifySignature(pub, hash[:], sig[:64]) {
		return domain.Signed{}, domain.ErrInvalid
	}
	body, _ := json.Marshal(struct {
		Prepared  domain.Prepared `json:"prepared"`
		Signature string          `json:"signature"`
		PublicKey string          `json:"public_key"`
	}{p, hex.EncodeToString(sig), hex.EncodeToString(pub)})
	return domain.Signed{TxID: domain.Hash(struct {
		Domain  string
		Payload json.RawMessage
	}{"settleforge-simulator", p.Payload}), Raw: body}, nil
}
func (s *Simulator) Broadcast(ctx context.Context, signed domain.Signed) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	var envelope struct {
		Prepared  domain.Prepared `json:"prepared"`
		Signature string          `json:"signature"`
		PublicKey string          `json:"public_key"`
	}
	if err := json.Unmarshal(signed.Raw, &envelope); err != nil {
		return err
	}
	p := envelope.Prepared
	hash := sha256.Sum256(p.Payload)
	sig, err := hex.DecodeString(envelope.Signature)
	if err != nil || len(sig) != 65 {
		return domain.ErrInvalid
	}
	pub, err := hex.DecodeString(envelope.PublicKey)
	if err != nil || !crypto.VerifySignature(pub, hash[:], sig[:64]) {
		return domain.ErrInvalid
	}
	expected := domain.Hash(struct {
		Domain  string
		Payload json.RawMessage
	}{"settleforge-simulator", p.Payload})
	if expected != signed.TxID {
		return domain.ErrInvalid
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.State.Transfers[signed.TxID]; !ok {
		s.State.Transfers[signed.TxID] = simTransfer{Prepared: p, Success: true, Fee: "1"}
		if err = s.save(); err != nil {
			return err
		}
	}
	if s.failNext {
		s.failNext = false
		return ErrUnknown
	}
	return nil
}
func (s *Simulator) Mine(wallets []domain.Wallet) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.State.Height++
	for hash, tx := range s.State.Transfers {
		if tx.Confirmed {
			continue
		}
		i := tx.Prepared.Intent
		key := tx.Prepared.WalletID + ":" + i.Asset
		balance, _ := new(big.Int).SetString(s.State.Balances[key], 10)
		if balance == nil {
			balance = new(big.Int)
		}
		amount, _ := domain.Units(i.Amount)
		fee := big.NewInt(1)
		total := new(big.Int).Add(new(big.Int).Set(amount), fee)
		if balance.Cmp(total) < 0 {
			tx.Success = false
			tx.Fee = "0"
		} else {
			balance.Sub(balance, total)
			s.State.Balances[key] = balance.String()
			for _, w := range wallets {
				if w.Address == i.Destination && w.Network == i.Network {
					target := w.ID + ":" + i.Asset
					n, _ := new(big.Int).SetString(s.State.Balances[target], 10)
					if n == nil {
						n = new(big.Int)
					}
					s.State.Balances[target] = n.Add(n, amount).String()
				}
			}
		}
		tx.Confirmed = true
		s.State.Transfers[hash] = tx
	}
	return s.save()
}
func (s *Simulator) Receipt(ctx context.Context, hash string) (domain.Receipt, error) {
	if err := ctx.Err(); err != nil {
		return domain.Receipt{}, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	tx, ok := s.State.Transfers[hash]
	if !ok {
		return domain.Receipt{}, nil
	}
	return domain.Receipt{Found: true, Confirmed: tx.Confirmed, Success: tx.Success, Fee: tx.Fee, BlockHash: "simulated-block", Height: s.State.Height}, nil
}
func (s *Simulator) Balance(ctx context.Context, w domain.Wallet, a domain.Asset) (string, error) {
	if err := ctx.Err(); err != nil {
		return "", err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	n := s.State.Balances[w.ID+":"+a.ID]
	if n == "" {
		n = "0"
	}
	return n, nil
}
