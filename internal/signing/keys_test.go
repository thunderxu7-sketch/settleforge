package signing

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
)

func TestApprovalsBindEveryIntentField(t *testing.T) {
	pub, key, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	a := Approvers{"alice": pub}
	i := domain.Intent{ID: "operation", Kind: "withdrawal", WalletID: "wallet", UserID: "user", Asset: "tron-nile/TRX", Network: "tron-nile", Destination: "recipient", Amount: "10", FeeCap: "1", ExpiresAt: time.Now().Add(time.Hour).Unix()}
	proof := SignApproval(i, "alice", key)
	if err = a.Verify(i, proof); err != nil {
		t.Fatal(err)
	}
	mutations := []func(*domain.Intent){func(i *domain.Intent) { i.ID += "x" }, func(i *domain.Intent) { i.Kind = "sweep" }, func(i *domain.Intent) { i.WalletID += "x" }, func(i *domain.Intent) { i.UserID += "x" }, func(i *domain.Intent) { i.Asset += "x" }, func(i *domain.Intent) { i.Network += "x" }, func(i *domain.Intent) { i.Destination += "x" }, func(i *domain.Intent) { i.Amount = "11" }, func(i *domain.Intent) { i.FeeCap = "2" }, func(i *domain.Intent) { i.ExpiresAt++ }}
	for n, mutate := range mutations {
		copy := i
		mutate(&copy)
		if err = a.Verify(copy, proof); err == nil {
			t.Fatalf("mutation %d accepted", n)
		}
	}
	if err = a.VerifyQuorum(i, []domain.Approval{proof, proof}, 2); err == nil {
		t.Fatal("same approver counted twice")
	}
}
func TestLocalProviderAndAllAddressFormats(t *testing.T) {
	ctx := context.Background()
	keys := LocalKeys{Dir: t.TempDir()}
	ref, err := keys.Create(ctx)
	if err != nil {
		t.Fatal(err)
	}
	pub, err := keys.PublicKey(ctx, ref)
	if err != nil {
		t.Fatal(err)
	}
	for _, network := range []string{"tron-nile", "evm-dev", "btc-regtest"} {
		address, e := Address(network, pub)
		if e != nil {
			t.Fatal(e)
		}
		if e = ValidateAddress(network, address); e != nil {
			t.Fatal(e)
		}
	}
	h := sha256.Sum256([]byte("public test payload"))
	sig, err := keys.SignDigest(ctx, ref, h[:])
	if err != nil {
		t.Fatal(err)
	}
	if !crypto.VerifySignature(pub, h[:], sig[:64]) {
		t.Fatal("invalid signature")
	}
	recovered, err := Recoverable(h[:], sig[:64], pub)
	if err != nil {
		t.Fatal(err)
	}
	if !crypto.VerifySignature(pub, h[:], recovered[:64]) {
		t.Fatal("invalid normalized signature")
	}
	if _, err = keys.PublicKey(ctx, "../../secret"); err == nil {
		t.Fatal("path traversal accepted")
	}
}
