package rfq

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"github.com/thunderxu7-sketch/settleforge/internal/store"
)

const (
	ETH = "evm-dev/ETH"
	USD = "evm-dev/LABUSD"
)

// LabMaker uses a synthetic fixed price, NOT a market data feed. No execution
// RPC is exposed: local settlement transfers reserved ledger liabilities only.
type LabMaker struct {
	Name     string
	Key      ed25519.PrivateKey
	PriceUSD int64
	FeeBPS   int64
}

func (m *LabMaker) ID() string                   { return m.Name }
func (m *LabMaker) PublicKey() ed25519.PublicKey { return m.Key.Public().(ed25519.PublicKey) }
func (m *LabMaker) Quote(ctx context.Context, in domain.RFQRequest) (domain.RFQQuote, error) {
	if err := ctx.Err(); err != nil {
		return domain.RFQQuote{}, err
	}
	n, err := domain.Units(in.SellAmount)
	if err != nil || in.Network != "evm-dev" || m.PriceUSD <= 0 || m.FeeBPS < 0 || m.FeeBPS >= 10000 {
		return domain.RFQQuote{}, domain.ErrInvalid
	}
	// ETH has 18 decimals; LABUSD has 6. PriceUSD is synthetic whole USD/ETH.
	switch {
	case in.SellAsset == ETH && in.BuyAsset == USD:
		n.Mul(n, big.NewInt(m.PriceUSD)).Quo(n, big.NewInt(1_000_000_000_000))
	case in.SellAsset == USD && in.BuyAsset == ETH:
		n.Mul(n, big.NewInt(1_000_000_000_000)).Quo(n, big.NewInt(m.PriceUSD))
	default:
		return domain.RFQQuote{}, domain.ErrInvalid
	}
	fee := new(big.Int).Quo(new(big.Int).Mul(n, big.NewInt(m.FeeBPS)), big.NewInt(10000))
	n.Sub(n, fee)
	if _, err = domain.Units(n.String()); err != nil {
		return domain.RFQQuote{}, err
	}
	o := domain.RFQOffer{RFQRequest: in, QuoteID: uuid.NewString(), MakerID: m.Name, BuyAmount: n.String(), FeeAmount: fee.String(), ExpiresAt: time.Now().Add(60 * time.Second).Unix(), Mode: Mode}
	return domain.RFQQuote{RFQOffer: o, Signature: base64.StdEncoding.EncodeToString(ed25519.Sign(m.Key, QuotePayload(o)))}, nil
}

func OpenLab(ctx context.Context, st *store.Store, dir string) ([]Source, error) {
	if err := os.MkdirAll(dir, 0700); err != nil {
		return nil, err
	}
	if err := st.InitRFQLab(ctx); err != nil {
		return nil, err
	}
	out := []Source{}
	for _, m := range []*LabMaker{{Name: "lab-alpha", PriceUSD: 2500, FeeBPS: 20}, {Name: "lab-beta", PriceUSD: 2510, FeeBPS: 30}} {
		path := filepath.Join(dir, m.Name+".key")
		raw, err := os.ReadFile(path)
		if os.IsNotExist(err) {
			_, key, e := ed25519.GenerateKey(rand.Reader)
			if e != nil {
				return nil, e
			}
			raw = key
			file, openErr := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
			if os.IsExist(openErr) {
				raw, err = os.ReadFile(path)
			} else if openErr != nil {
				return nil, openErr
			} else {
				_, err = file.Write(raw)
				closeErr := file.Close()
				if err == nil {
					err = closeErr
				}
			}
		}
		if err != nil {
			return nil, err
		}
		if len(raw) != ed25519.PrivateKeySize {
			return nil, fmt.Errorf("invalid lab maker key")
		}
		m.Key = ed25519.PrivateKey(raw)
		if err = st.RegisterRFQMaker(ctx, m.Name, m.PublicKey()); err != nil {
			return nil, err
		}
		for asset, amount := range map[string]string{ETH: "100000000000000000000", USD: "1000000000000"} {
			if err = st.FundRFQLabMaker(ctx, m.Name, asset, amount); err != nil {
				return nil, err
			}
		}
		out = append(out, m)
	}
	return out, nil
}
