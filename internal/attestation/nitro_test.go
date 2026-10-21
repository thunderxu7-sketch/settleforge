package attestation

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha512"
	"crypto/x509"
	"crypto/x509/pkix"
	"github.com/fxamacker/cbor/v2"
	"github.com/hf/nitrite"
	"math/big"
	"testing"
	"time"
)

// These COSE documents are signed by a fresh test CA, never by AWS hardware.
func fixture(t *testing.T, now time.Time) (*Verifier, func(Challenge, func(*nitrite.Document)) []byte) {
	t.Helper()
	rootKey, _ := ecdsa.GenerateKey(elliptic.P384(), rand.Reader)
	root := &x509.Certificate{SerialNumber: big.NewInt(1), Subject: pkix.Name{CommonName: "TEST ONLY"}, NotBefore: now.Add(-time.Hour), NotAfter: now.Add(time.Hour), IsCA: true, BasicConstraintsValid: true, KeyUsage: x509.KeyUsageCertSign, SignatureAlgorithm: x509.ECDSAWithSHA384}
	rootDER, e := x509.CreateCertificate(rand.Reader, root, root, &rootKey.PublicKey, rootKey)
	if e != nil {
		t.Fatal(e)
	}
	rootCert, _ := x509.ParseCertificate(rootDER)
	leafKey, _ := ecdsa.GenerateKey(elliptic.P384(), rand.Reader)
	leaf := &x509.Certificate{SerialNumber: big.NewInt(2), Subject: pkix.Name{CommonName: "TEST ENCLAVE"}, NotBefore: now.Add(-time.Hour), NotAfter: now.Add(time.Hour), KeyUsage: x509.KeyUsageDigitalSignature, SignatureAlgorithm: x509.ECDSAWithSHA384}
	leafDER, e := x509.CreateCertificate(rand.Reader, leaf, rootCert, &leafKey.PublicKey, rootKey)
	if e != nil {
		t.Fatal(e)
	}
	pool := x509.NewCertPool()
	pool.AddCert(rootCert)
	pcrs := map[uint][]byte{0: bytes.Repeat([]byte{1}, 48), 1: bytes.Repeat([]byte{2}, 48), 2: bytes.Repeat([]byte{3}, 48)}
	v := &Verifier{PCRs: pcrs, roots: pool}
	build := func(c Challenge, mutate func(*nitrite.Document)) []byte {
		doc := nitrite.Document{ModuleID: "test-only", Timestamp: uint64(now.UnixMilli()), Digest: "SHA384", PCRs: map[uint][]byte{}, Certificate: leafDER, CABundle: [][]byte{rootDER}, Nonce: c.Nonce, PublicKey: c.PublicKey, UserData: c.UserData}
		for i, b := range pcrs {
			doc.PCRs[i] = append([]byte{}, b...)
		}
		if mutate != nil {
			mutate(&doc)
		}
		payload, _ := cbor.Marshal(doc)
		protected, _ := cbor.Marshal(map[int]int{1: -35})
		structure, _ := cbor.Marshal([]any{"Signature1", protected, []byte{}, payload})
		digest := sha512.Sum384(structure)
		r, s, _ := ecdsa.Sign(rand.Reader, leafKey, digest[:])
		signature := append(r.FillBytes(make([]byte, 48)), s.FillBytes(make([]byte, 48))...)
		out, _ := cbor.Marshal([]any{protected, map[int]any{}, payload, signature})
		return out
	}
	return v, build
}
func TestNitroCOSETrustFreshnessPCRBindingReplay(t *testing.T) {
	now := time.Now()
	v, build := fixture(t, now)
	pub := bytes.Repeat([]byte{9}, 65)
	c, e := v.NewChallenge(pub, []byte("policy"), now)
	if e != nil {
		t.Fatal(e)
	}
	raw := build(c, nil)
	if _, e = v.Verify(raw, c.Nonce, now); e != nil {
		t.Fatal(e)
	}
	if _, e = v.Verify(raw, c.Nonce, now); e == nil {
		t.Fatal("replay accepted")
	}
	cases := map[string]func(*nitrite.Document){"debug": func(d *nitrite.Document) { d.PCRs[0] = make([]byte, 48) }, "PCR": func(d *nitrite.Document) { d.PCRs[2][0] ^= 1 }, "key": func(d *nitrite.Document) { d.PublicKey = []byte("unbound-key") }, "nonce": func(d *nitrite.Document) { d.Nonce = []byte("wrong-nonce") }, "policy": func(d *nitrite.Document) { d.UserData = []byte("wrong-policy") }, "stale": func(d *nitrite.Document) { d.Timestamp = uint64(now.Add(-2 * time.Minute).UnixMilli()) }, "future": func(d *nitrite.Document) { d.Timestamp = uint64(now.Add(time.Minute).UnixMilli()) }}
	for name, mutate := range cases {
		t.Run(name, func(t *testing.T) {
			c, _ := v.NewChallenge(pub, []byte("policy"), now)
			if _, e := v.Verify(build(c, mutate), c.Nonce, now); e == nil {
				t.Fatal("invalid evidence accepted")
			}
		})
	}
	production := &Verifier{PCRs: v.PCRs}
	c, _ = production.NewChallenge(pub, nil, now)
	if _, e = production.Verify(build(c, nil), c.Nonce, now); e == nil {
		t.Fatal("production trusted a test CA")
	}
	c, _ = v.NewChallenge(pub, nil, now)
	raw = build(c, nil)
	raw[len(raw)-1] ^= 1
	if _, e = v.Verify(raw, c.Nonce, now); e == nil {
		t.Fatal("tampered COSE signature accepted")
	}
	c, _ = v.NewChallenge(pub, nil, now)
	if _, e = v.Verify(build(c, nil), c.Nonce, now.Add(2*time.Minute)); e == nil {
		t.Fatal("expired challenge accepted")
	}
}
