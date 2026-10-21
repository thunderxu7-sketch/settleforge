package signing

import (
	"context"
	"crypto/sha256"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/miekg/pkcs11"
	"os"
	"testing"
)

func TestPKCS11SoftHSMRealSignatureAndNonExtractable(t *testing.T) {
	module := os.Getenv("TEST_PKCS11_MODULE")
	if module == "" {
		t.Skip("set TEST_PKCS11_MODULE and initialize a SoftHSM test token")
	}
	provider, err := OpenPKCS11(module, "SettleForge-test", os.Getenv("TEST_PKCS11_PIN"))
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	ref, err := provider.Create(ctx)
	if err != nil {
		t.Fatal(err)
	}
	pub, err := provider.PublicKey(ctx, ref)
	if err != nil {
		t.Fatal(err)
	}
	digest := sha256.Sum256([]byte("SettleForge PKCS11 acceptance"))
	sig, err := provider.SignDigest(ctx, ref, digest[:])
	if err != nil || len(sig) != 65 || !crypto.VerifySignature(pub, digest[:], sig[:64]) {
		t.Fatal("invalid HSM signature", err)
	}
	extractable, err := provider.Exportable(ref)
	if err != nil || extractable {
		t.Fatal("private key must be non-extractable", err)
	}
	handle, err := provider.find(ref, pkcs11.CKO_PRIVATE_KEY)
	if err != nil {
		t.Fatal(err)
	}
	attributes, exportErr := provider.p.GetAttributeValue(provider.session, handle, []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_VALUE, nil)})
	if exportErr == nil && len(attributes) > 0 && len(attributes[0].Value) > 0 {
		t.Fatal("token allowed private scalar export")
	}
	provider.Close()
	if _, err = OpenPKCS11(module, "SettleForge-test", "definitely-wrong-pin"); err == nil {
		t.Fatal("bad PIN accepted")
	}
}
