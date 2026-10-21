// Package attestation verifies Nitro documents against the AWS root and an
// operator-pinned measurement policy. No emulated document counts as hardware proof.
package attestation

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/hf/nitrite"
	"sync"
	"time"
)

type Challenge struct {
	Nonce     []byte
	PublicKey []byte
	UserData  []byte
	ExpiresAt time.Time
}
type Verifier struct {
	PCRs    map[uint][]byte
	MaxAge  time.Duration
	mu      sync.Mutex
	pending map[string]Challenge
	// roots is intentionally unexported; production callers cannot replace AWS
	// trust with a server-provided CA. Unit tests inject their own test-only root.
	roots *x509.CertPool
}

func (v *Verifier) NewChallenge(publicKey, userData []byte, now time.Time) (Challenge, error) {
	if len(publicKey) < 32 || len(publicKey) > 1024 || len(userData) > 1024 {
		return Challenge{}, fmt.Errorf("invalid challenge binding")
	}
	nonce := make([]byte, 32)
	if _, err := rand.Read(nonce); err != nil {
		return Challenge{}, err
	}
	c := Challenge{Nonce: nonce, PublicKey: append([]byte{}, publicKey...), UserData: append([]byte{}, userData...), ExpiresAt: now.Add(time.Minute)}
	v.mu.Lock()
	defer v.mu.Unlock()
	if v.pending == nil {
		v.pending = map[string]Challenge{}
	}
	for k, old := range v.pending {
		if !old.ExpiresAt.After(now) {
			delete(v.pending, k)
		}
	}
	if len(v.pending) >= 1024 {
		return Challenge{}, fmt.Errorf("too many outstanding challenges")
	}
	v.pending[hex.EncodeToString(nonce)] = c
	return c, nil
}
func (v *Verifier) Verify(raw, nonce []byte, now time.Time) (*nitrite.Document, error) {
	if len(raw) == 0 || len(raw) > 64<<10 || len(nonce) != 32 {
		return nil, fmt.Errorf("invalid attestation envelope")
	}
	result, err := nitrite.Verify(raw, nitrite.VerifyOptions{Roots: v.roots, CurrentTime: now})
	// nitrite can return a non-nil result with an invalid certificate/signature.
	if err != nil || result == nil || !result.SignatureOK || result.Document == nil {
		return nil, fmt.Errorf("attestation signature or certificate rejected")
	}
	v.mu.Lock()
	defer v.mu.Unlock()
	key := hex.EncodeToString(nonce)
	c, ok := v.pending[key]
	if !ok || !c.ExpiresAt.After(now) {
		return nil, fmt.Errorf("unknown, expired, or consumed challenge")
	}
	if err = v.policy(result.Document, c, now); err != nil {
		return nil, err
	}
	delete(v.pending, key)
	return result.Document, nil
}
func (v *Verifier) policy(doc *nitrite.Document, c Challenge, now time.Time) error {
	maxAge := v.MaxAge
	if maxAge <= 0 || maxAge > time.Minute {
		maxAge = time.Minute
	}
	timestamp := time.UnixMilli(int64(doc.Timestamp))
	if timestamp.After(now.Add(5*time.Second)) || now.Sub(timestamp) > maxAge {
		return fmt.Errorf("stale or future attestation")
	}
	if !bytes.Equal(doc.Nonce, c.Nonce) || !bytes.Equal(doc.PublicKey, c.PublicKey) || !bytes.Equal(doc.UserData, c.UserData) {
		return fmt.Errorf("attestation challenge/key/policy binding mismatch")
	}
	for _, index := range []uint{0, 1, 2} {
		expected, ok := v.PCRs[index]
		actual := doc.PCRs[index]
		if !ok || len(expected) != 48 || len(actual) != 48 || bytes.Equal(actual, make([]byte, 48)) || !bytes.Equal(actual, expected) {
			return fmt.Errorf("PCR%d mismatch or debug enclave", index)
		}
	}
	for index, expected := range v.PCRs {
		if len(expected) != 48 || !bytes.Equal(expected, doc.PCRs[index]) {
			return fmt.Errorf("PCR%d mismatch", index)
		}
	}
	return nil
}
func PolicyBinding(approvalKeys, transactionPolicy []byte) []byte {
	body, _ := json.Marshal(struct {
		Domain                          string
		ApprovalKeys, TransactionPolicy []byte
	}{"settleforge-enclave-policy-v1", approvalKeys, transactionPolicy})
	digest := sha256.Sum256(body)
	return digest[:]
}
