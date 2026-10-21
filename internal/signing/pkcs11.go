package signing

import (
	"context"
	"encoding/asn1"
	"fmt"
	"github.com/google/uuid"
	"github.com/miekg/pkcs11"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"sync"
)

// PKCS11 holds a logged-in session. The software acceptance token is SoftHSM;
// physical HSM support depends on its secp256k1 mechanisms and vendor module.
type PKCS11 struct {
	p       *pkcs11.Ctx
	session pkcs11.SessionHandle
	mu      sync.Mutex
}

func OpenPKCS11(module, label, pin string) (*PKCS11, error) {
	p := pkcs11.New(module)
	if p == nil {
		return nil, fmt.Errorf("PKCS11 module unavailable")
	}
	if err := p.Initialize(); err != nil {
		p.Destroy()
		return nil, err
	}
	fail := func(err error) (*PKCS11, error) { _ = p.Finalize(); p.Destroy(); return nil, err }
	slots, err := p.GetSlotList(true)
	if err != nil {
		return fail(err)
	}
	var slot uint
	found := false
	for _, s := range slots {
		info, e := p.GetTokenInfo(s)
		if e != nil {
			return fail(e)
		}
		if info.Label == label {
			slot = s
			found = true
			break
		}
	}
	if !found {
		return fail(fmt.Errorf("PKCS11 token not found"))
	}
	session, err := p.OpenSession(slot, pkcs11.CKF_SERIAL_SESSION|pkcs11.CKF_RW_SESSION)
	if err != nil {
		return fail(err)
	}
	if err = p.Login(session, pkcs11.CKU_USER, pin); err != nil {
		_ = p.CloseSession(session)
		return fail(fmt.Errorf("PKCS11 login rejected"))
	}
	return &PKCS11{p: p, session: session}, nil
}
func (p *PKCS11) Close() {
	p.mu.Lock()
	defer p.mu.Unlock()
	_ = p.p.Logout(p.session)
	_ = p.p.CloseSession(p.session)
	_ = p.p.Finalize()
	p.p.Destroy()
}
func (p *PKCS11) Create(ctx context.Context) (string, error) {
	if err := ctx.Err(); err != nil {
		return "", err
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	ref := uuid.NewString()
	curve, _ := asn1.Marshal(asn1.ObjectIdentifier{1, 3, 132, 0, 10})
	public := []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_TOKEN, true), pkcs11.NewAttribute(pkcs11.CKA_VERIFY, true), pkcs11.NewAttribute(pkcs11.CKA_ID, []byte(ref)), pkcs11.NewAttribute(pkcs11.CKA_LABEL, ref), pkcs11.NewAttribute(pkcs11.CKA_EC_PARAMS, curve)}
	private := []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_TOKEN, true), pkcs11.NewAttribute(pkcs11.CKA_PRIVATE, true), pkcs11.NewAttribute(pkcs11.CKA_SIGN, true), pkcs11.NewAttribute(pkcs11.CKA_SENSITIVE, true), pkcs11.NewAttribute(pkcs11.CKA_EXTRACTABLE, false), pkcs11.NewAttribute(pkcs11.CKA_ID, []byte(ref)), pkcs11.NewAttribute(pkcs11.CKA_LABEL, ref)}
	_, _, err := p.p.GenerateKeyPair(p.session, []*pkcs11.Mechanism{pkcs11.NewMechanism(pkcs11.CKM_EC_KEY_PAIR_GEN, nil)}, public, private)
	return ref, err
}
func (p *PKCS11) find(ref string, class uint) (pkcs11.ObjectHandle, error) {
	if _, err := uuid.Parse(ref); err != nil {
		return 0, domain.ErrInvalid
	}
	if err := p.p.FindObjectsInit(p.session, []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_ID, []byte(ref)), pkcs11.NewAttribute(pkcs11.CKA_CLASS, class)}); err != nil {
		return 0, err
	}
	objects, _, err := p.p.FindObjects(p.session, 2)
	endErr := p.p.FindObjectsFinal(p.session)
	if err != nil {
		return 0, err
	}
	if endErr != nil {
		return 0, endErr
	}
	if len(objects) != 1 {
		return 0, domain.ErrNotFound
	}
	return objects[0], nil
}
func (p *PKCS11) public(ref string) ([]byte, error) {
	handle, err := p.find(ref, pkcs11.CKO_PUBLIC_KEY)
	if err != nil {
		return nil, err
	}
	attrs, err := p.p.GetAttributeValue(p.session, handle, []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_EC_POINT, nil)})
	if err != nil || len(attrs) != 1 {
		return nil, domain.ErrInvalid
	}
	var point []byte
	rest, err := asn1.Unmarshal(attrs[0].Value, &point)
	if err != nil || len(rest) != 0 || len(point) != 65 {
		return nil, domain.ErrInvalid
	}
	return point, nil
}
func (p *PKCS11) PublicKey(ctx context.Context, ref string) ([]byte, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.public(ref)
}
func (p *PKCS11) SignDigest(ctx context.Context, ref string, digest []byte) ([]byte, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if len(digest) != 32 {
		return nil, domain.ErrInvalid
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	handle, err := p.find(ref, pkcs11.CKO_PRIVATE_KEY)
	if err != nil {
		return nil, err
	}
	pub, err := p.public(ref)
	if err != nil {
		return nil, err
	}
	if err = p.p.SignInit(p.session, []*pkcs11.Mechanism{pkcs11.NewMechanism(pkcs11.CKM_ECDSA, nil)}, handle); err != nil {
		return nil, err
	}
	raw, err := p.p.Sign(p.session, digest)
	if err != nil {
		return nil, err
	}
	return Recoverable(digest, raw, pub)
}

// Exportable tests token policy without retrieving the private scalar.
func (p *PKCS11) Exportable(ref string) (bool, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	handle, err := p.find(ref, pkcs11.CKO_PRIVATE_KEY)
	if err != nil {
		return false, err
	}
	attrs, err := p.p.GetAttributeValue(p.session, handle, []*pkcs11.Attribute{pkcs11.NewAttribute(pkcs11.CKA_EXTRACTABLE, nil)})
	if err != nil || len(attrs) != 1 {
		return false, err
	}
	return len(attrs[0].Value) > 0 && attrs[0].Value[0] != 0, nil
}
