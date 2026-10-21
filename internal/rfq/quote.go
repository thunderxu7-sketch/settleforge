// Package rfq implements an explicitly local RFQ laboratory. Its signed orders
// and approval payloads are domain-separated from chain and withdrawal signing.
package rfq

import (
	"context"
	"crypto/ed25519"
	"encoding/base64"
	"errors"
	"fmt"
	"math/big"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
)

const Mode = "local-simulated"

type Source interface {
	ID() string
	PublicKey() ed25519.PublicKey
	Quote(context.Context, domain.RFQRequest) (domain.RFQQuote, error)
}

func QuotePayload(o domain.RFQOffer) []byte {
	return []byte("settleforge-rfq-offer-v1:" + domain.Hash(o))
}

func ApprovalPayload(i domain.RFQTradeIntent) []byte {
	return []byte("settleforge-rfq-approval-v1:" + domain.Hash(i))
}

func SignApproval(i domain.RFQTradeIntent, actor string, key ed25519.PrivateKey) domain.Approval {
	return domain.Approval{Actor: actor, Signature: base64.StdEncoding.EncodeToString(ed25519.Sign(key, ApprovalPayload(i)))}
}

func VerifyQuote(q domain.RFQQuote, key ed25519.PublicKey) error {
	if len(key) != ed25519.PublicKeySize || q.Mode != Mode || q.MakerID == "" || q.SellAsset == q.BuyAsset || q.Network != "evm-dev" {
		return domain.ErrInvalid
	}
	for _, id := range []string{q.QuoteID, q.ID, q.UserID} {
		if _, err := uuid.Parse(id); err != nil {
			return domain.ErrInvalid
		}
	}
	for _, n := range []string{q.SellAmount, q.BuyAmount} {
		if _, err := domain.Units(n); err != nil {
			return err
		}
	}
	if q.FeeAmount != "0" {
		if _, err := domain.Units(q.FeeAmount); err != nil {
			return err
		}
	}
	if _, err := domain.Units(gross(q)); err != nil {
		return err
	}
	sig, err := base64.StdEncoding.DecodeString(q.Signature)
	if err != nil || !ed25519.Verify(key, QuotePayload(q.RFQOffer), sig) {
		return domain.ErrApproval
	}
	return nil
}

func gross(q domain.RFQQuote) string {
	n, _ := new(big.Int).SetString(q.BuyAmount, 10)
	f, _ := new(big.Int).SetString(q.FeeAmount, 10)
	if n == nil || f == nil {
		return ""
	}
	return n.Add(n, f).String()
}

// Collect queries sources concurrently. One slow/invalid source cannot prevent
// a healthy source from returning a quote. Best is the highest NET buy amount.
func Collect(ctx context.Context, in domain.RFQRequest, sources []Source, timeout time.Duration) (domain.RFQResult, error) {
	out := domain.RFQResult{RequestID: in.ID, Quotes: []domain.RFQQuote{}, Rejected: map[string]string{}, Mode: Mode}
	if timeout <= 0 || len(sources) == 0 || len(sources) > 16 {
		return out, domain.ErrInvalid
	}
	type answer struct {
		source Source
		quote  domain.RFQQuote
		err    error
	}
	answers := make(chan answer, len(sources))
	seen := map[string]bool{}
	for _, source := range sources {
		if source.ID() == "" || seen[source.ID()] {
			return out, domain.ErrInvalid
		}
		seen[source.ID()] = true
	}
	child, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	var wg sync.WaitGroup
	for _, source := range sources {
		wg.Go(func() {
			q, err := source.Quote(child, in)
			answers <- answer{source, q, err}
		})
	}
	// The buffered channel lets even a delayed provider finish after the caller
	// times out. Providers must respect context to avoid leaking their own work.
	go func() { wg.Wait(); close(answers) }()
	for len(seen) > 0 {
		select {
		case <-child.Done():
			for id := range seen {
				out.Rejected[id] = "timeout"
			}
			clear(seen)
		case a, ok := <-answers:
			if !ok {
				clear(seen)
				continue
			}
			delete(seen, a.source.ID())
			now := time.Now().Unix()
			if a.err != nil {
				if errors.Is(a.err, context.DeadlineExceeded) || errors.Is(a.err, context.Canceled) {
					out.Rejected[a.source.ID()] = "timeout"
				} else {
					out.Rejected[a.source.ID()] = "unavailable"
				}
			} else if a.quote.MakerID != a.source.ID() || a.quote.RFQRequest != in || a.quote.ExpiresAt <= now || a.quote.ExpiresAt > now+120 || VerifyQuote(a.quote, a.source.PublicKey()) != nil {
				out.Rejected[a.source.ID()] = "invalid_quote"
			} else {
				out.Quotes = append(out.Quotes, a.quote)
			}
		}
	}
	if err := ctx.Err(); err != nil {
		return out, err
	}
	if len(out.Quotes) == 0 {
		return out, fmt.Errorf("no valid RFQ sources")
	}
	sort.Slice(out.Quotes, func(i, j int) bool {
		a, _ := domain.Units(out.Quotes[i].BuyAmount)
		b, _ := domain.Units(out.Quotes[j].BuyAmount)
		if n := a.Cmp(b); n != 0 {
			return n > 0
		}
		return out.Quotes[i].MakerID < out.Quotes[j].MakerID
	})
	out.BestID = out.Quotes[0].QuoteID
	return out, nil
}
