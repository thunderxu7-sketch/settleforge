package service

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/thunderxu7-sketch/settleforge/internal/chain"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"github.com/thunderxu7-sketch/settleforge/internal/signing"
	"github.com/thunderxu7-sketch/settleforge/internal/store"
)

type Service struct {
	Store     *store.Store
	Keys      KeyManager
	Provider  signing.Provider
	Approvers signing.Approvers
	Chains    map[string]chain.Adapter
	Backend   SigningBackend
}
type SigningBackend interface {
	Sign(context.Context, domain.Prepared, []domain.Approval) (domain.Signed, error)
}
type KeyManager interface {
	signing.Provider
	Create(context.Context) (string, error)
}

func (s *Service) Asset(ctx context.Context, id string) (domain.Asset, error) {
	assets, err := s.Store.Assets(ctx)
	if err != nil {
		return domain.Asset{}, err
	}
	for _, a := range assets {
		if a.ID == id {
			return a, nil
		}
	}
	return domain.Asset{}, domain.ErrNotFound
}
func (s *Service) CreateWallet(ctx context.Context, w domain.Wallet) (domain.Wallet, error) {
	if w.Purpose != "deposit" && w.Purpose != "treasury" && w.Purpose != "vault" {
		return w, domain.ErrInvalid
	}
	if _, ok := s.Chains[w.Network]; !ok {
		return w, domain.ErrInvalid
	}
	if (w.Purpose == "deposit" && w.UserID == "") || (w.Purpose != "deposit" && w.UserID != "") {
		return w, domain.ErrInvalid
	}
	ref, err := s.Keys.Create(ctx)
	if err != nil {
		return w, err
	}
	pub, err := s.Keys.PublicKey(ctx, ref)
	if err != nil {
		return w, err
	}
	w.KeyRef = ref
	w.Address, err = signing.Address(w.Network, pub)
	if err != nil {
		return w, err
	}
	if registrar, ok := s.Chains[w.Network].(interface {
		Register(context.Context, domain.Wallet, []byte) error
	}); ok {
		if err = registrar.Register(ctx, w, pub); err != nil {
			return w, err
		}
	}
	return s.Store.AddWallet(ctx, w)
}
func (s *Service) Create(ctx context.Context, i domain.Intent, key string, sweep bool) (domain.Withdrawal, bool, error) {
	if err := signing.ValidateAddress(i.Network, i.Destination); err != nil {
		return domain.Withdrawal{}, false, err
	}
	if _, ok := s.Chains[i.Network]; !ok {
		return domain.Withdrawal{}, false, domain.ErrInvalid
	}
	wallet, err := s.Store.Wallet(ctx, i.WalletID)
	if err != nil {
		return domain.Withdrawal{}, false, err
	}
	if wallet.Address == i.Destination {
		return domain.Withdrawal{}, false, domain.ErrInvalid
	}
	if i.Network == "btc-regtest" {
		n, err := domain.Units(i.Amount)
		if err != nil || n.Cmp(big.NewInt(546)) < 0 {
			return domain.Withdrawal{}, false, domain.ErrInvalid
		}
	}
	if sweep {
		return s.Store.CreateSweep(ctx, i, key)
	}
	return s.Store.CreateWithdrawal(ctx, i, key)
}
func (s *Service) Approve(ctx context.Context, id string, a domain.Approval) error {
	w, err := s.Store.Withdrawal(ctx, id)
	if err != nil {
		return err
	}
	if err = s.Approvers.Verify(w.Intent, a); err != nil {
		return err
	}
	return s.Store.AddApproval(ctx, id, a, 2)
}
func (s *Service) Tick(ctx context.Context) error {
	job, err := s.Store.Claim(ctx)
	if err != nil {
		return err
	}
	err = s.Process(ctx, job.WithdrawalID)
	if err != nil {
		if retryErr := s.Store.Retry(ctx, job, err); retryErr != nil {
			return retryErr
		}
		return err
	}
	return nil
}
func (s *Service) Process(ctx context.Context, id string) error {
	w, err := s.Store.Withdrawal(ctx, id)
	if err != nil {
		return err
	}
	if w.State == "confirmed" || w.State == "failed" || w.State == "review" {
		return nil
	}
	a, err := s.Asset(ctx, w.Asset)
	if err != nil {
		return err
	}
	adapter, ok := s.Chains[w.Network]
	if !ok {
		return domain.ErrInvalid
	}
	prepared, signed, err := s.Store.Attempt(ctx, id)
	if errors.Is(err, domain.ErrNotFound) {
		proofs, e := s.Store.Approvals(ctx, id)
		if e != nil {
			return e
		}
		if e = s.Approvers.VerifyQuorum(w.Intent, proofs, 2); e != nil {
			return s.Store.Review(ctx, id, "approval missing or expired before transaction construction")
		}
		wallet, e := s.Store.Wallet(ctx, w.WalletID)
		if e != nil {
			return e
		}
		prepared, e = adapter.Build(ctx, wallet, a, w.Intent)
		if e != nil {
			return e
		}
		prepared, e = s.Store.SavePrepared(ctx, prepared)
		if e != nil {
			return e
		}
		signed = nil
	} else if err != nil {
		return err
	}
	if domain.Hash(prepared.Intent) != domain.Hash(w.Intent) {
		return s.Store.Review(ctx, id, "persisted intent mismatch")
	}
	if signed == nil {
		active, e := s.Store.UserActive(ctx, w.UserID)
		if e != nil {
			return e
		}
		if !active {
			return s.Store.Review(ctx, id, "account review prevents issuing a new signature")
		}
		proofs, e := s.Store.Approvals(ctx, id)
		if e != nil {
			return e
		}
		if e = s.Approvers.VerifyQuorum(prepared.Intent, proofs, 2); e != nil {
			return s.Store.Review(ctx, id, "approval missing or expired before signing")
		}
		var result domain.Signed
		if s.Backend != nil {
			result, e = s.Backend.Sign(ctx, prepared, proofs)
		} else {
			result, e = adapter.Sign(ctx, prepared, s.Provider)
		}
		if e != nil {
			return e
		}
		result, e = s.Store.SaveSigned(ctx, id, result)
		if e != nil {
			return e
		}
		signed = &result
	}
	receipt, err := adapter.Receipt(ctx, signed.TxID)
	if err != nil {
		return err
	}
	if receipt.Found && receipt.Confirmed {
		return s.Store.Settle(ctx, id, receipt)
	}
	if !receipt.Found {
		err = adapter.Broadcast(ctx, *signed)
		if e := s.Store.BroadcastState(ctx, id, err != nil); e != nil {
			return e
		}
		if err != nil {
			return err
		}
	}
	return fmt.Errorf("awaiting chain confirmation")
}
func (s *Service) RunWorker(ctx context.Context, report func(error)) {
	timer := time.NewTicker(250 * time.Millisecond)
	defer timer.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-timer.C:
			run, cancel := context.WithTimeout(ctx, 10*time.Second)
			err := s.Tick(run)
			cancel()
			if err != nil && !errors.Is(err, domain.ErrNotFound) && report != nil {
				report(err)
			}
		}
	}
}

type Reconciliation struct {
	WalletID   string `json:"wallet_id"`
	Asset      string `json:"asset"`
	Ledger     string `json:"ledger"`
	Chain      string `json:"chain"`
	Difference string `json:"difference"`
}

func (s *Service) Reconcile(ctx context.Context) ([]Reconciliation, error) {
	entries, err := s.Store.Ledger(ctx)
	if err != nil {
		return nil, err
	}
	wallets, err := s.Store.Wallets(ctx)
	if err != nil {
		return nil, err
	}
	assets, err := s.Store.Assets(ctx)
	if err != nil {
		return nil, err
	}
	out := []Reconciliation{}
	for _, w := range wallets {
		adapter, ok := s.Chains[w.Network]
		if !ok {
			continue
		}
		for _, a := range assets {
			if a.Network != w.Network {
				continue
			}
			ledger := "0"
			for _, b := range entries {
				if b.Asset == a.ID && b.Code == "wallet:"+w.ID {
					ledger = b.Amount
				}
			}
			onchain, e := adapter.Balance(ctx, w, a)
			if e != nil {
				return nil, e
			}
			l, ok := new(big.Int).SetString(ledger, 10)
			if !ok {
				return nil, domain.ErrInvalid
			}
			c, ok := new(big.Int).SetString(onchain, 10)
			if !ok {
				return nil, domain.ErrInvalid
			}
			difference := new(big.Int).Sub(c, l)
			out = append(out, Reconciliation{WalletID: w.ID, Asset: a.ID, Ledger: ledger, Chain: onchain, Difference: difference.String()})
		}
	}
	return out, nil
}
