package httpapi

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
)

func (a *API) rfqRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/rfq/quotes", func(w http.ResponseWriter, r *http.Request) {
		if a.RFQ == nil {
			fail(w, r, domain.ErrState)
			return
		}
		var in domain.RFQRequest
		if err := decode(w, r, &in); err != nil {
			fail(w, r, err)
			return
		}
		out, err := a.RFQ.Request(r.Context(), in)
		result(w, r, out, err)
	})
	mux.HandleFunc("POST /v1/rfq/trades", func(w http.ResponseWriter, r *http.Request) {
		if a.RFQ == nil {
			fail(w, r, domain.ErrState)
			return
		}
		var in domain.RFQAccept
		if err := decode(w, r, &in); err != nil {
			fail(w, r, err)
			return
		}
		out, created, err := a.RFQ.Accept(r.Context(), in, r.Header.Get("Idempotency-Key"))
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
	mux.HandleFunc("GET /v1/rfq/trades/{id}", func(w http.ResponseWriter, r *http.Request) {
		if a.RFQ == nil {
			fail(w, r, domain.ErrState)
			return
		}
		if _, err := uuid.Parse(r.PathValue("id")); err != nil {
			fail(w, r, domain.ErrInvalid)
			return
		}
		out, err := a.RFQ.Store.RFQTrade(r.Context(), r.PathValue("id"))
		result(w, r, out, err)
	})
	mux.HandleFunc("POST /v1/rfq/trades/{id}/approvals", func(w http.ResponseWriter, r *http.Request) {
		if a.RFQ == nil {
			fail(w, r, domain.ErrState)
			return
		}
		var in domain.Approval
		if err := decode(w, r, &in); err != nil {
			fail(w, r, err)
			return
		}
		if err := a.RFQ.Approve(r.Context(), r.PathValue("id"), in); err != nil {
			fail(w, r, err)
			return
		}
		respond(w, 200, map[string]string{"status": "accepted"})
	})
	mux.HandleFunc("POST /v1/rfq/trades/{id}/cancel", func(w http.ResponseWriter, r *http.Request) {
		if a.RFQ == nil {
			fail(w, r, domain.ErrState)
			return
		}
		if err := a.RFQ.Process(r.Context(), r.PathValue("id"), true); err != nil {
			fail(w, r, err)
			return
		}
		out, err := a.RFQ.Store.RFQTrade(r.Context(), r.PathValue("id"))
		result(w, r, out, err)
	})
}
