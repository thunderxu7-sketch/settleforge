package signer

import (
	"bytes"
	"context"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"io"
	"net/http"
	"time"
)

func (e *Engine) Handler(token string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		if token == "" || subtle.ConstantTimeCompare([]byte(r.Header.Get("Authorization")), []byte("Bearer "+token)) != 1 {
			http.Error(w, "unauthorized", 401)
			return
		}
		if r.Method != "POST" || r.URL.Path != "/v1/sign" {
			http.NotFound(w, r)
			return
		}
		var request Request
		decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 2<<20))
		decoder.DisallowUnknownFields()
		if err := decoder.Decode(&request); err != nil {
			http.Error(w, "invalid request", 400)
			return
		}
		if err := decoder.Decode(new(any)); err != io.EOF {
			http.Error(w, "invalid request", 400)
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), time.Minute)
		defer cancel()
		signed, err := e.Sign(ctx, request.Prepared, request.Approvals)
		if err != nil {
			http.Error(w, "signature rejected", 403)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(signed)
	})
}

type Client struct {
	URL, Token string
	HTTP       *http.Client
}

func (c Client) Sign(ctx context.Context, p domain.Prepared, proofs []domain.Approval) (domain.Signed, error) {
	body, err := json.Marshal(Request{p, proofs})
	if err != nil {
		return domain.Signed{}, err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", c.URL+"/v1/sign", bytes.NewReader(body))
	if err != nil {
		return domain.Signed{}, err
	}
	req.Header.Set("Authorization", "Bearer "+c.Token)
	req.Header.Set("Content-Type", "application/json")
	client := c.HTTP
	if client == nil {
		client = &http.Client{Timeout: time.Minute}
	}
	res, err := client.Do(req)
	if err != nil {
		return domain.Signed{}, fmt.Errorf("signing service unavailable")
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		return domain.Signed{}, domain.ErrApproval
	}
	var signed domain.Signed
	err = json.NewDecoder(io.LimitReader(res.Body, 2<<20)).Decode(&signed)
	return signed, err
}
