package rfq

import (
	"context"
	"crypto/ed25519"
	"encoding/base64"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"github.com/thunderxu7-sketch/settleforge/internal/signing"
	"github.com/thunderxu7-sketch/settleforge/internal/store"
)

type Service struct {
	Store     *store.Store
	Sources   []Source
	Approvers signing.Approvers
}

func (s *Service) Request(ctx context.Context, in domain.RFQRequest) (domain.RFQResult, error) {
	if in.ID != "" || in.Network != "evm-dev" || !((in.SellAsset == ETH && in.BuyAsset == USD) || (in.SellAsset == USD && in.BuyAsset == ETH)) {
		return domain.RFQResult{}, domain.ErrInvalid
	}
	if _, err := uuid.Parse(in.UserID); err != nil {
		return domain.RFQResult{}, domain.ErrInvalid
	}
	if _, err := domain.Units(in.SellAmount); err != nil {
		return domain.RFQResult{}, err
	}
	if err := s.Store.RFQUserActive(ctx, in.UserID); err != nil {
		return domain.RFQResult{}, err
	}
	in.ID = uuid.NewString()
	out, err := Collect(ctx, in, s.Sources, 750*time.Millisecond)
	if err == nil {
		err = s.Store.SaveRFQQuotes(ctx, out.Quotes)
	}
	return out, err
}

func (s *Service) Accept(ctx context.Context, in domain.RFQAccept, key string) (domain.RFQTrade, bool, error) {
	for _, id := range []string{in.UserID, in.QuoteID} {
		if _, err := uuid.Parse(id); err != nil {
			return domain.RFQTrade{}, false, domain.ErrInvalid
		}
	}
	if _, err := domain.Units(in.MinBuyAmount); err != nil {
		return domain.RFQTrade{}, false, err
	}
	if len(key) < 1 || len(key) > 100 {
		return domain.RFQTrade{}, false, domain.ErrInvalid
	}
	return s.Store.AcceptRFQ(ctx, in, key, VerifyQuote)
}

func (s *Service) verifyApproval(in domain.RFQTradeIntent, proof domain.Approval) error {
	pub := s.Approvers[proof.Actor]
	sig, err := base64.StdEncoding.DecodeString(proof.Signature)
	if len(pub) != ed25519.PublicKeySize || err != nil || !ed25519.Verify(pub, ApprovalPayload(in), sig) {
		return domain.ErrApproval
	}
	return nil
}

func (s *Service) Approve(ctx context.Context, id string, proof domain.Approval) error {
	if _, err := uuid.Parse(id); err != nil {
		return domain.ErrInvalid
	}
	t, err := s.Store.RFQTrade(ctx, id)
	if err != nil {
		return err
	}
	if err = s.verifyApproval(t.RFQTradeIntent, proof); err != nil {
		return err
	}
	return s.Store.AddRFQApproval(ctx, id, proof)
}

func (s *Service) verifyTrade(in domain.RFQTradeIntent, proofs []domain.Approval, maker ed25519.PublicKey) error {
	if in.UserID != in.Quote.UserID {
		return domain.ErrApproval
	}
	if err := VerifyQuote(in.Quote, maker); err != nil {
		return err
	}
	min, err := domain.Units(in.MinBuyAmount)
	if err != nil {
		return err
	}
	net, _ := domain.Units(in.Quote.BuyAmount)
	if net.Cmp(min) < 0 {
		return domain.ErrApproval
	}
	seen := map[string]bool{}
	for _, p := range proofs {
		if err = s.verifyApproval(in, p); err != nil {
			return err
		}
		seen[p.Actor] = true
	}
	if len(seen) < 2 {
		return domain.ErrApproval
	}
	return nil
}

func (s *Service) Process(ctx context.Context, id string, cancel bool) error {
	if _, err := uuid.Parse(id); err != nil {
		return domain.ErrInvalid
	}
	return s.Store.ProcessRFQ(ctx, id, cancel, s.verifyTrade)
}

func (s *Service) RunWorker(ctx context.Context) {
	ticker := time.NewTicker(250 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			ids, err := s.Store.PendingRFQ(ctx)
			if err != nil {
				slog.Error("RFQ pending query failed", "error", err)
				continue
			}
			for _, id := range ids {
				if err = s.Process(ctx, id, false); err != nil {
					slog.Warn("RFQ settlement paused", "trade_id", id, "error", err)
				}
			}
		}
	}
}
