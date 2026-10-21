package signing

import (
	"context"
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/asn1"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/btcutil/base58"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/google/uuid"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
)

type Provider interface {
	PublicKey(context.Context, string) ([]byte, error)
	SignDigest(context.Context, string, []byte) ([]byte, error)
}

// LocalKeys is an explicit development provider, never a hardware-backed signer.
type LocalKeys struct{ Dir string }

func (k LocalKeys) Create(ctx context.Context) (string, error) {
	if err := ctx.Err(); err != nil {
		return "", err
	}
	if err := os.MkdirAll(k.Dir, 0700); err != nil {
		return "", err
	}
	key, err := crypto.GenerateKey()
	if err != nil {
		return "", err
	}
	id := uuid.NewString()
	err = os.WriteFile(filepath.Join(k.Dir, id), crypto.FromECDSA(key), 0600)
	return id, err
}
func (k LocalKeys) load(ref string) (*ecdsa.PrivateKey, error) {
	if _, err := uuid.Parse(ref); err != nil {
		return nil, domain.ErrInvalid
	}
	b, err := os.ReadFile(filepath.Join(k.Dir, ref))
	if err != nil {
		return nil, err
	}
	return crypto.ToECDSA(b)
}
func (k LocalKeys) PublicKey(ctx context.Context, ref string) ([]byte, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	key, err := k.load(ref)
	if err != nil {
		return nil, err
	}
	return crypto.FromECDSAPub(&key.PublicKey), nil
}
func (k LocalKeys) SignDigest(ctx context.Context, ref string, digest []byte) ([]byte, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if len(digest) != 32 {
		return nil, domain.ErrInvalid
	}
	key, err := k.load(ref)
	if err != nil {
		return nil, err
	}
	return crypto.Sign(digest, key)
}
func Address(network string, pub []byte) (string, error) {
	key, err := crypto.UnmarshalPubkey(pub)
	if err != nil {
		return "", err
	}
	switch network {
	case "tron-nile":
		return base58.CheckEncode(crypto.PubkeyToAddress(*key).Bytes(), 0x41), nil
	case "evm-dev":
		return crypto.PubkeyToAddress(*key).Hex(), nil
	case "btc-regtest":
		a, err := btcutil.NewAddressWitnessPubKeyHash(btcutil.Hash160(crypto.CompressPubkey(key)), &chaincfg.RegressionNetParams)
		if err != nil {
			return "", err
		}
		return a.EncodeAddress(), nil
	default:
		return "", domain.ErrInvalid
	}
}
func ValidateAddress(network, address string) error {
	switch network {
	case "tron-nile":
		data, version, err := base58.CheckDecode(address)
		if err != nil || version != 0x41 || len(data) != 20 {
			return domain.ErrInvalid
		}
	case "evm-dev":
		b, err := hex.DecodeString(strings.TrimPrefix(address, "0x"))
		if err != nil || len(b) != 20 {
			return domain.ErrInvalid
		}
	case "btc-regtest":
		a, err := btcutil.DecodeAddress(address, &chaincfg.RegressionNetParams)
		if err != nil || !a.IsForNet(&chaincfg.RegressionNetParams) {
			return domain.ErrInvalid
		}
	default:
		return domain.ErrInvalid
	}
	return nil
}

func DER(signature []byte) ([]byte, error) {
	if len(signature) < 64 {
		return nil, domain.ErrInvalid
	}
	return asn1.Marshal(struct{ R, S *big.Int }{new(big.Int).SetBytes(signature[:32]), new(big.Int).SetBytes(signature[32:64])})
}

// Recoverable normalizes HSM or MPC ECDSA output and recovers the Ethereum/TRON recovery bit.
func Recoverable(digest, sig, pub []byte) ([]byte, error) {
	if len(digest) != 32 || len(sig) != 64 {
		return nil, domain.ErrInvalid
	}
	r := new(big.Int).SetBytes(sig[:32])
	s := new(big.Int).SetBytes(sig[32:])
	n := crypto.S256().Params().N
	if r.Sign() <= 0 || s.Sign() <= 0 || r.Cmp(n) >= 0 || s.Cmp(n) >= 0 {
		return nil, domain.ErrInvalid
	}
	if s.Cmp(new(big.Int).Rsh(new(big.Int).Set(n), 1)) > 0 {
		s.Sub(n, s)
	}
	out := make([]byte, 65)
	r.FillBytes(out[:32])
	s.FillBytes(out[32:64])
	for v := byte(0); v < 2; v++ {
		out[64] = v
		recovered, err := crypto.Ecrecover(digest, out)
		if err == nil && hex.EncodeToString(recovered) == hex.EncodeToString(pub) {
			return out, nil
		}
	}
	return nil, fmt.Errorf("signature does not match registered public key")
}

type Approvers map[string]ed25519.PublicKey

func ApprovalPayload(i domain.Intent) []byte {
	return []byte("settleforge-approval-v1:" + domain.Hash(i))
}
func SignApproval(i domain.Intent, actor string, key ed25519.PrivateKey) domain.Approval {
	return domain.Approval{Actor: actor, Signature: base64.StdEncoding.EncodeToString(ed25519.Sign(key, ApprovalPayload(i)))}
}
func (a Approvers) Verify(i domain.Intent, proof domain.Approval) error {
	if i.ExpiresAt <= time.Now().Unix() {
		return domain.ErrApproval
	}
	key, ok := a[proof.Actor]
	if !ok {
		return domain.ErrApproval
	}
	sig, err := base64.StdEncoding.DecodeString(proof.Signature)
	if err != nil || !ed25519.Verify(key, ApprovalPayload(i), sig) {
		return domain.ErrApproval
	}
	return nil
}
func (a Approvers) VerifyQuorum(i domain.Intent, proofs []domain.Approval, quorum int) error {
	if quorum < 2 {
		return domain.ErrApproval
	}
	seen := map[string]bool{}
	for _, proof := range proofs {
		if err := a.Verify(i, proof); err != nil {
			return err
		}
		seen[proof.Actor] = true
	}
	if len(seen) < quorum {
		return domain.ErrApproval
	}
	return nil
}
func GenerateApprovers(dir string) (Approvers, error) {
	if err := os.MkdirAll(dir, 0700); err != nil {
		return nil, err
	}
	out := Approvers{}
	for _, actor := range []string{"operator-a", "operator-b"} {
		path := filepath.Join(dir, actor+".key")
		b, err := os.ReadFile(path)
		if os.IsNotExist(err) {
			_, key, e := ed25519.GenerateKey(rand.Reader)
			if e != nil {
				return nil, e
			}
			b = key
			err = os.WriteFile(path, b, 0600)
		}
		if err != nil {
			return nil, err
		}
		if len(b) != ed25519.PrivateKeySize {
			return nil, domain.ErrInvalid
		}
		out[actor] = ed25519.PrivateKey(b).Public().(ed25519.PublicKey)
	}
	return out, nil
}
func PublicApprovers(a Approvers) string { b, _ := json.Marshal(a); return string(b) }
