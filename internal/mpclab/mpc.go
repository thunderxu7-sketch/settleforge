// Package mpclab runs actual 2-of-3 GG18 threshold ECDSA. Its transport is
// in-process: it is a protocol lab, not three independent security domains.
package mpclab

import (
	"context"
	"crypto/elliptic"
	"encoding/json"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"sync"

	"github.com/bnb-chain/tss-lib/v2/common"
	"github.com/bnb-chain/tss-lib/v2/ecdsa/keygen"
	tsssign "github.com/bnb-chain/tss-lib/v2/ecdsa/signing"
	"github.com/bnb-chain/tss-lib/v2/tss"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"github.com/thunderxu7-sketch/settleforge/internal/signing"
)

func ids(indices []int) tss.SortedPartyIDs {
	parties := make(tss.UnSortedPartyIDs, len(indices))
	for i, n := range indices {
		parties[i] = tss.NewPartyID(fmt.Sprint(n), fmt.Sprintf("party-%d", n), big.NewInt(int64(n)))
	}
	return tss.SortPartyIDs(parties)
}
func route(ctx context.Context, msg tss.Message, parties []tss.Party) error {
	data, _, err := msg.WireBytes()
	if err != nil {
		return err
	}
	for _, party := range parties {
		if party.PartyID().Id == msg.GetFrom().Id {
			continue
		}
		deliver := msg.IsBroadcast()
		for _, to := range msg.GetTo() {
			if to.Id == party.PartyID().Id {
				deliver = true
			}
		}
		if deliver {
			if err = ctx.Err(); err != nil {
				return err
			}
			if _, e := party.UpdateFromBytes(data, msg.GetFrom(), msg.IsBroadcast()); e != nil {
				return e
			}
		}
	}
	return nil
}
func Generate(ctx context.Context, dir string, progress func(string)) error {
	if _, err := os.Stat(filepath.Join(dir, "party-1.json")); err == nil {
		return fmt.Errorf("MPC shares already exist; refusing to overwrite")
	}
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	pre := make([]*keygen.LocalPreParams, 3)
	var wg sync.WaitGroup
	errs := make(chan error, 3)
	for i := range pre {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			p, err := keygen.GeneratePreParamsWithContext(ctx, 2)
			if err != nil {
				errs <- err
				return
			}
			pre[i] = p
			if progress != nil {
				progress(fmt.Sprintf("Paillier pre-parameters ready for party %d", i+1))
			}
		}(i)
	}
	wg.Wait()
	close(errs)
	for err := range errs {
		if err != nil {
			return err
		}
	}
	pids := ids([]int{1, 2, 3})
	out := make(chan tss.Message, 1024)
	end := make(chan *keygen.LocalPartySaveData, 3)
	fail := make(chan error, 3)
	parties := []tss.Party{}
	for i, id := range pids {
		params := tss.NewParameters(tss.S256(), tss.NewPeerContext(pids), id, 3, 1)
		party := keygen.NewLocalParty(params, out, end, *pre[i])
		parties = append(parties, party)
		go func(p tss.Party) {
			if e := p.Start(); e != nil {
				fail <- e
			}
		}(party)
	}
	for completed := 0; completed < 3; {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case err := <-fail:
			return err
		case msg := <-out:
			if err := route(ctx, msg, parties); err != nil {
				return err
			}
		case save := <-end:
			index, err := save.OriginalIndex()
			if err != nil {
				return err
			}
			body, err := json.Marshal(save)
			if err != nil {
				return err
			}
			if err = os.WriteFile(filepath.Join(dir, fmt.Sprintf("party-%d.json", index+1)), body, 0600); err != nil {
				return err
			}
			completed++
		}
	}
	if progress != nil {
		progress("2-of-3 DKG complete; only per-party shares persisted")
	}
	return nil
}

type Provider struct {
	Dir          string
	Participants []int
	mu           sync.Mutex
}

func (p *Provider) load(index int) (keygen.LocalPartySaveData, error) {
	var data keygen.LocalPartySaveData
	if index < 1 || index > 3 {
		return data, domain.ErrInvalid
	}
	body, err := os.ReadFile(filepath.Join(p.Dir, fmt.Sprintf("party-%d.json", index)))
	if err != nil {
		return data, err
	}
	err = json.Unmarshal(body, &data)
	return data, err
}
func (p *Provider) PublicKey(ctx context.Context, ref string) ([]byte, error) {
	if ref != "mpc-2of3" {
		return nil, domain.ErrInvalid
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	save, err := p.load(1)
	if err != nil {
		return nil, err
	}
	return elliptic.Marshal(tss.S256(), save.ECDSAPub.X(), save.ECDSAPub.Y()), nil
}
func (p *Provider) SignDigest(ctx context.Context, ref string, digest []byte) ([]byte, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if ref != "mpc-2of3" || len(digest) != 32 || len(p.Participants) < 2 || len(p.Participants) > 3 {
		return nil, domain.ErrApproval
	}
	seen := map[int]bool{}
	for _, i := range p.Participants {
		if seen[i] || i < 1 || i > 3 {
			return nil, domain.ErrApproval
		}
		seen[i] = true
	}
	pids := ids(p.Participants)
	out := make(chan tss.Message, 1024)
	end := make(chan *common.SignatureData, len(pids))
	fail := make(chan error, len(pids))
	parties := []tss.Party{}
	for _, id := range pids {
		n := int(id.KeyInt().Int64())
		save, err := p.load(n)
		if err != nil {
			return nil, err
		}
		params := tss.NewParameters(tss.S256(), tss.NewPeerContext(pids), id, len(pids), 1)
		party := tsssign.NewLocalParty(new(big.Int).SetBytes(digest), params, save, out, end, len(digest))
		parties = append(parties, party)
		go func(party tss.Party) {
			if e := party.Start(); e != nil {
				fail <- e
			}
		}(party)
	}
	var result []byte
	for completed := 0; completed < len(pids); {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case err := <-fail:
			return nil, err
		case msg := <-out:
			if err := route(ctx, msg, parties); err != nil {
				return nil, err
			}
		case sig := <-end:
			if result != nil && string(result) != string(sig.Signature) {
				return nil, domain.ErrConflict
			}
			result = append([]byte{}, sig.Signature...)
			completed++
		}
	}
	pub, err := p.PublicKey(ctx, ref)
	if err != nil {
		return nil, err
	}
	if len(result) != 64 || !crypto.VerifySignature(pub, digest, result) {
		return nil, domain.ErrInvalid
	}
	return signing.Recoverable(digest, result, pub)
}
