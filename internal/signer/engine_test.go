package signer

import (
	"context"
	"crypto/ed25519"
	"encoding/json"
	"errors"
	"github.com/thunderxu7-sketch/settleforge/internal/chain"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"github.com/thunderxu7-sketch/settleforge/internal/signing"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestIndependentSignerApprovalBindingsTamperingAndDurableReplay(t *testing.T) {
	ctx := context.Background()
	dir := t.TempDir()
	keys := signing.LocalKeys{Dir: filepath.Join(dir, "keys")}
	ref, e := keys.Create(ctx)
	if e != nil {
		t.Fatal(e)
	}
	pub, _ := keys.PublicKey(ctx, ref)
	address, _ := signing.Address("tron-nile", pub)
	actors, e := signing.GenerateApprovers(filepath.Join(dir, "operators"))
	if e != nil {
		t.Fatal(e)
	}
	intent := domain.Intent{ID: "intent-1", Kind: "withdrawal", WalletID: "wallet-1", UserID: "user-1", Asset: "tron-nile/TRX", Network: "tron-nile", Destination: "TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL", Amount: "100", FeeCap: "5", ExpiresAt: time.Now().Add(time.Hour).Unix()}
	sim := &chain.Simulator{}
	prepared, e := sim.Build(ctx, domain.Wallet{ID: intent.WalletID, Network: intent.Network, Address: address, KeyRef: ref}, domain.Asset{ID: intent.Asset, Network: intent.Network}, intent)
	if e != nil {
		t.Fatal(e)
	}
	proofs := []domain.Approval{}
	for _, actor := range []string{"operator-a", "operator-b"} {
		raw, _ := os.ReadFile(filepath.Join(dir, "operators", actor+".key"))
		proofs = append(proofs, signing.SignApproval(intent, actor, ed25519.PrivateKey(raw)))
	}
	bindings := map[string]Binding{intent.WalletID: {WalletID: intent.WalletID, KeyRef: ref, Network: intent.Network, Address: address}}
	engine := &Engine{Provider: keys, Approvers: actors, Bindings: bindings, JournalPath: filepath.Join(dir, "journal.json")}
	if _, e = engine.Sign(ctx, prepared, proofs[:1]); !errors.Is(e, domain.ErrApproval) {
		t.Fatal("one approval accepted", e)
	}
	bad := prepared
	bad.KeyRef = "other-key"
	if _, e = engine.Sign(ctx, bad, proofs); e == nil {
		t.Fatal("unbound key accepted")
	}
	// Keep the approved intent intact while replacing the transaction payload.
	bad = prepared
	var payload map[string]any
	_ = json.Unmarshal(bad.Payload, &payload)
	payload["intent"].(map[string]any)["amount"] = "99999"
	bad.Payload, _ = json.Marshal(payload)
	if _, e = engine.Sign(ctx, bad, proofs); e == nil {
		t.Fatal("payload differs from approval but was signed")
	}
	server := httptest.NewServer(engine.Handler("separate-signer-token-at-least-24"))
	defer server.Close()
	client := Client{URL: server.URL, Token: "separate-signer-token-at-least-24"}
	signed, e := client.Sign(ctx, prepared, proofs)
	if e != nil {
		t.Fatal(e)
	}
	restarted := &Engine{Provider: keys, Approvers: actors, Bindings: bindings, JournalPath: engine.JournalPath}
	replay, e := restarted.Sign(ctx, prepared, nil)
	if e != nil || domain.Hash(replay) != domain.Hash(signed) {
		t.Fatal("restart did not return the original signed transaction", e)
	}
	bad = prepared
	bad.Intent.Amount = "101"
	if _, e = restarted.Sign(ctx, bad, proofs); !errors.Is(e, domain.ErrConflict) {
		t.Fatal("same intent ID allowed a different transaction", e)
	}
	client.Token = "invalid"
	if _, e = client.Sign(ctx, prepared, proofs); e == nil {
		t.Fatal("unauthenticated caller signed")
	}
}
