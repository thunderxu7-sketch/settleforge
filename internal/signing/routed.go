package signing

import (
	"context"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
)

// Routed selects a configured provider by an opaque key reference, never by a
// client-supplied provider name. References are provisioned by trusted operators.
type Routed struct {
	Default Provider
	ByRef   map[string]Provider
}

func (r Routed) provider(ref string) (Provider, error) {
	if p, ok := r.ByRef[ref]; ok {
		return p, nil
	}
	if r.Default == nil {
		return nil, domain.ErrNotFound
	}
	return r.Default, nil
}
func (r Routed) PublicKey(ctx context.Context, ref string) ([]byte, error) {
	p, e := r.provider(ref)
	if e != nil {
		return nil, e
	}
	return p.PublicKey(ctx, ref)
}
func (r Routed) SignDigest(ctx context.Context, ref string, digest []byte) ([]byte, error) {
	p, e := r.provider(ref)
	if e != nil {
		return nil, e
	}
	return p.SignDigest(ctx, ref, digest)
}
