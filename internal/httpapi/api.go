package httpapi

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/thunderxu7-sketch/settleforge/internal/chain"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"github.com/thunderxu7-sketch/settleforge/internal/service"
	"github.com/thunderxu7-sketch/settleforge/internal/signing"
)

type API struct {
	Service *service.Service
	Token   string
}

func (a *API) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) { respond(w, 200, map[string]string{"status": "ok"}) })
	mux.HandleFunc("GET /readyz", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), time.Second)
		defer cancel()
		if err := a.Service.Store.DB.Ping(ctx); err != nil {
			respond(w, 503, map[string]string{"status": "unavailable"})
			return
		}
		respond(w, 200, map[string]string{"status": "ready"})
	})
	mux.HandleFunc("GET /v1/status", func(w http.ResponseWriter, r *http.Request) {
		modes := map[string]string{}
		for net, adapter := range a.Service.Chains {
			modes[net] = "rpc"
			if _, ok := adapter.(*chain.Simulator); ok {
				modes[net] = "simulated"
			}
		}
		provider := "local-development"
		if _, ok := a.Service.Provider.(*signing.PKCS11); ok {
			provider = "pkcs11"
		}
		backend := "embedded"
		if a.Service.Backend != nil {
			backend = "independent-service"
		}
		respond(w, 200, map[string]any{"name": "SettleForge", "environment": "development", "networks": modes, "approval_quorum": 2, "key_provider": provider, "signing_backend": backend})
	})
	mux.HandleFunc("POST /v1/users", func(w http.ResponseWriter, r *http.Request) {
		var in struct {
			ExternalRef string `json:"external_ref"`
		}
		if err := decode(w, r, &in); err != nil {
			fail(w, r, err)
			return
		}
		id, err := a.Service.Store.CreateUser(r.Context(), in.ExternalRef)
		if err != nil {
			fail(w, r, err)
			return
		}
		respond(w, 201, map[string]string{"id": id, "external_ref": in.ExternalRef})
	})
	mux.HandleFunc("GET /v1/assets", func(w http.ResponseWriter, r *http.Request) {
		out, err := a.Service.Store.Assets(r.Context())
		result(w, r, out, err)
	})
	mux.HandleFunc("GET /v1/wallets", func(w http.ResponseWriter, r *http.Request) {
		out, err := a.Service.Store.Wallets(r.Context())
		result(w, r, out, err)
	})
	mux.HandleFunc("POST /v1/wallets", func(w http.ResponseWriter, r *http.Request) {
		var in struct {
			UserID  string `json:"user_id"`
			Network string `json:"network"`
			Purpose string `json:"purpose"`
		}
		if err := decode(w, r, &in); err != nil {
			fail(w, r, err)
			return
		}
		if in.UserID != "" {
			if _, err := uuid.Parse(in.UserID); err != nil {
				fail(w, r, domain.ErrInvalid)
				return
			}
		}
		out, err := a.Service.CreateWallet(r.Context(), domain.Wallet{UserID: in.UserID, Network: in.Network, Purpose: in.Purpose})
		if err != nil {
			fail(w, r, err)
			return
		}
		respond(w, 201, out)
	})
	mux.HandleFunc("GET /v1/users/{id}/balances", func(w http.ResponseWriter, r *http.Request) {
		if _, err := uuid.Parse(r.PathValue("id")); err != nil {
			fail(w, r, domain.ErrInvalid)
			return
		}
		out, err := a.Service.Store.Balances(r.Context(), r.PathValue("id"))
		result(w, r, out, err)
	})
	for _, kind := range []string{"withdrawals", "sweeps"} {
		sweep := kind == "sweeps"
		mux.HandleFunc("POST /v1/"+kind, func(w http.ResponseWriter, r *http.Request) {
			var in domain.Intent
			if err := decode(w, r, &in); err != nil {
				fail(w, r, err)
				return
			}
			if in.ID != "" || in.Kind != "" {
				fail(w, r, domain.ErrInvalid)
				return
			}
			if _, err := uuid.Parse(in.UserID); err != nil {
				fail(w, r, domain.ErrInvalid)
				return
			}
			if _, err := uuid.Parse(in.WalletID); err != nil {
				fail(w, r, domain.ErrInvalid)
				return
			}
			out, created, err := a.Service.Create(r.Context(), in, r.Header.Get("Idempotency-Key"), sweep)
			if err != nil {
				fail(w, r, err)
				return
			}
			status := 200
			if created {
				status = 201
			}
			respond(w, status, out)
		})
	}
	mux.HandleFunc("GET /v1/withdrawals/{id}", func(w http.ResponseWriter, r *http.Request) {
		if _, err := uuid.Parse(r.PathValue("id")); err != nil {
			fail(w, r, domain.ErrInvalid)
			return
		}
		out, err := a.Service.Store.Withdrawal(r.Context(), r.PathValue("id"))
		result(w, r, out, err)
	})
	mux.HandleFunc("POST /v1/withdrawals/{id}/approvals", func(w http.ResponseWriter, r *http.Request) {
		if _, err := uuid.Parse(r.PathValue("id")); err != nil {
			fail(w, r, domain.ErrInvalid)
			return
		}
		var in domain.Approval
		if err := decode(w, r, &in); err != nil {
			fail(w, r, err)
			return
		}
		if err := a.Service.Approve(r.Context(), r.PathValue("id"), in); err != nil {
			fail(w, r, err)
			return
		}
		respond(w, 200, map[string]string{"status": "accepted"})
	})
	mux.HandleFunc("GET /v1/ledger", func(w http.ResponseWriter, r *http.Request) {
		out, err := a.Service.Store.Ledger(r.Context())
		result(w, r, out, err)
	})
	mux.HandleFunc("GET /v1/reconciliation", func(w http.ResponseWriter, r *http.Request) {
		out, err := a.Service.Reconcile(r.Context())
		result(w, r, out, err)
	})
	mux.HandleFunc("POST /v1/dev/capital", func(w http.ResponseWriter, r *http.Request) {
		var in struct {
			Wallet    string `json:"wallet_id"`
			Asset     string `json:"asset"`
			Amount    string `json:"amount"`
			Reference string `json:"reference"`
		}
		if err := decode(w, r, &in); err != nil {
			fail(w, r, err)
			return
		}
		wallet, err := a.Service.Store.Wallet(r.Context(), in.Wallet)
		if err != nil {
			fail(w, r, err)
			return
		}
		sim, ok := a.Service.Chains[wallet.Network].(*chain.Simulator)
		if !ok || in.Reference == "" {
			fail(w, r, domain.ErrState)
			return
		}
		if err = sim.CreditOnce(in.Wallet, in.Asset, in.Amount, "capital:"+in.Reference); err == nil {
			err = a.Service.Store.Capital(r.Context(), in.Wallet, in.Asset, in.Amount, in.Reference)
		}
		if err != nil {
			fail(w, r, err)
			return
		}
		respond(w, 200, map[string]string{"status": "credited", "mode": "simulated"})
	})
	mux.HandleFunc("POST /v1/dev/deposits", func(w http.ResponseWriter, r *http.Request) {
		var in domain.Deposit
		if err := decode(w, r, &in); err != nil {
			fail(w, r, err)
			return
		}
		sim, ok := a.Service.Chains[in.Network].(*chain.Simulator)
		if !ok {
			fail(w, r, domain.ErrState)
			return
		}
		if err := sim.CreditOnce(in.WalletID, in.Asset, in.Amount, "deposit:"+in.Network+":"+in.TxID+":"+stringIndex(in.Index)); err != nil {
			fail(w, r, err)
			return
		}
		if err := a.Service.Store.Observe(r.Context(), in); err != nil {
			fail(w, r, err)
			return
		}
		respond(w, 200, map[string]string{"status": "observed", "mode": "simulated"})
	})
	mux.HandleFunc("POST /v1/dev/mine", func(w http.ResponseWriter, r *http.Request) {
		wallets, err := a.Service.Store.Wallets(r.Context())
		if err != nil {
			fail(w, r, err)
			return
		}
		seen := map[*chain.Simulator]bool{}
		for _, adapter := range a.Service.Chains {
			if sim, ok := adapter.(*chain.Simulator); ok && !seen[sim] {
				seen[sim] = true
				if err = sim.Mine(wallets); err != nil {
					fail(w, r, err)
					return
				}
			}
		}
		respond(w, 200, map[string]string{"status": "mined", "mode": "simulated"})
	})
	mux.HandleFunc("POST /v1/dev/broadcast-timeout", func(w http.ResponseWriter, r *http.Request) {
		for _, adapter := range a.Service.Chains {
			if sim, ok := adapter.(*chain.Simulator); ok {
				sim.FailNextBroadcast()
			}
		}
		respond(w, 200, map[string]string{"status": "armed"})
	})
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := uuid.NewString()
		w.Header().Set("X-Request-ID", requestID)
		w.Header().Set("Cache-Control", "no-store")
		if strings.HasPrefix(r.URL.Path, "/v1/") {
			provided := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
			if a.Token == "" || subtle.ConstantTimeCompare([]byte(provided), []byte(a.Token)) != 1 {
				respond(w, 401, map[string]any{"error": map[string]string{"code": "UNAUTHENTICATED", "message": "valid bearer token required"}, "request_id": requestID})
				return
			}
		}
		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()
		mux.ServeHTTP(w, r.WithContext(ctx))
	})
}
func stringIndex(n int) string { b, _ := json.Marshal(n); return string(b) }
func decode(w http.ResponseWriter, r *http.Request, v any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	d := json.NewDecoder(r.Body)
	d.DisallowUnknownFields()
	if err := d.Decode(v); err != nil {
		return domain.ErrInvalid
	}
	if err := d.Decode(new(any)); !errors.Is(err, io.EOF) {
		return domain.ErrInvalid
	}
	return nil
}
func respond(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
func result(w http.ResponseWriter, r *http.Request, v any, err error) {
	if err != nil {
		fail(w, r, err)
		return
	}
	respond(w, 200, v)
}
func fail(w http.ResponseWriter, r *http.Request, err error) {
	status, code, message := 503, "DEPENDENCY_UNAVAILABLE", "dependency unavailable"
	switch {
	case errors.Is(err, domain.ErrInvalid):
		status, code, message = 400, "INVALID_ARGUMENT", "invalid input"
	case errors.Is(err, domain.ErrNotFound):
		status, code, message = 404, "NOT_FOUND", "resource not found"
	case errors.Is(err, domain.ErrConflict):
		status, code, message = 409, "CONFLICT", "request conflicts with existing data"
	case errors.Is(err, domain.ErrFunds):
		status, code, message = 409, "INSUFFICIENT_FUNDS", "insufficient available balance"
	case errors.Is(err, domain.ErrState):
		status, code, message = 409, "INVALID_STATE", "operation is not allowed in current state"
	case errors.Is(err, domain.ErrApproval):
		status, code, message = 403, "INVALID_APPROVAL", "approval does not match the authorized intent"
	}
	respond(w, status, map[string]any{"error": map[string]string{"code": code, "message": message}, "request_id": w.Header().Get("X-Request-ID")})
}
