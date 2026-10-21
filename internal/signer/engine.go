// Package signer enforces approvals and wallet/key bindings separately from the
// orchestration API. The standalone command loads its own trusted configuration.
package signer

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/thunderxu7-sketch/settleforge/internal/chain"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"github.com/thunderxu7-sketch/settleforge/internal/signing"
	"os"
	"path/filepath"
	"sync"
)

type Binding struct {
	WalletID string `json:"wallet_id"`
	KeyRef   string `json:"key_ref"`
	Network  string `json:"network"`
	Address  string `json:"address"`
}
type Request struct {
	Prepared  domain.Prepared   `json:"prepared"`
	Approvals []domain.Approval `json:"approvals"`
}
type record struct {
	Fingerprint string        `json:"fingerprint"`
	Signed      domain.Signed `json:"signed"`
}
type Engine struct {
	Provider    signing.Provider
	Approvers   signing.Approvers
	Bindings    map[string]Binding
	JournalPath string
	mu          sync.Mutex
	records     map[string]record
}

func (e *Engine) Sign(ctx context.Context, p domain.Prepared, proofs []domain.Approval) (domain.Signed, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	if err := ctx.Err(); err != nil {
		return domain.Signed{}, err
	}
	binding, ok := e.Bindings[p.WalletID]
	if !ok || p.Intent.WalletID != p.WalletID || p.KeyRef != binding.KeyRef || p.Network != binding.Network || p.Intent.Network != p.Network || p.Intent.ID == "" {
		return domain.Signed{}, domain.ErrApproval
	}
	pub, err := e.Provider.PublicKey(ctx, p.KeyRef)
	if err != nil {
		return domain.Signed{}, err
	}
	address, err := signing.Address(p.Network, pub)
	if err != nil || address != binding.Address {
		return domain.Signed{}, domain.ErrApproval
	}
	if e.records == nil {
		e.records = map[string]record{}
		body, err := os.ReadFile(e.JournalPath)
		if err == nil {
			if err = json.Unmarshal(body, &e.records); err != nil {
				return domain.Signed{}, err
			}
		} else if !errors.Is(err, os.ErrNotExist) {
			return domain.Signed{}, err
		}
	}
	fp := domain.Hash(p)
	if old, ok := e.records[p.Intent.ID]; ok {
		if old.Fingerprint != fp {
			return domain.Signed{}, domain.ErrConflict
		}
		return old.Signed, nil
	}
	if err = e.Approvers.VerifyQuorum(p.Intent, proofs, 2); err != nil {
		return domain.Signed{}, err
	}
	var adapter chain.Adapter
	switch p.Network {
	case "btc-regtest":
		adapter = &chain.Bitcoin{}
	case "tron-nile", "evm-dev":
		adapter = &chain.Simulator{}
	default:
		return domain.Signed{}, domain.ErrInvalid
	}
	// The adapter independently parses recipient, value, input ownership, change,
	// fee cap, network and key. No arbitrary digest-signing endpoint is exposed.
	signed, err := adapter.Sign(ctx, p, e.Provider)
	if err != nil {
		return domain.Signed{}, err
	}
	e.records[p.Intent.ID] = record{fp, signed}
	if err = e.persist(); err != nil {
		delete(e.records, p.Intent.ID)
		return domain.Signed{}, err
	}
	return signed, nil
}
func (e *Engine) persist() error {
	if e.JournalPath == "" {
		return domain.ErrInvalid
	}
	if err := os.MkdirAll(filepath.Dir(e.JournalPath), 0700); err != nil {
		return err
	}
	body, err := json.Marshal(e.records)
	if err != nil {
		return err
	}
	file, err := os.OpenFile(e.JournalPath+".tmp", os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	if _, err = file.Write(body); err == nil {
		err = file.Sync()
	}
	closeErr := file.Close()
	if err != nil {
		return err
	}
	if closeErr != nil {
		return closeErr
	}
	if err = os.Rename(e.JournalPath+".tmp", e.JournalPath); err != nil {
		return err
	}
	dir, err := os.Open(filepath.Dir(e.JournalPath))
	if err != nil {
		return err
	}
	defer dir.Close()
	return dir.Sync()
}
