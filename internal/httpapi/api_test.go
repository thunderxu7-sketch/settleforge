package httpapi

import (
	"github.com/thunderxu7-sketch/settleforge/internal/service"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestAuthenticationAndStrictInput(t *testing.T) {
	api := (&API{Service: &service.Service{}, Token: "test-token-at-least-24-characters"}).Handler()
	for _, path := range []string{"/v1/users", "/v1/ledger", "/v1/withdrawals", "/v1/dev/deposits"} {
		r := httptest.NewRequest("POST", path, strings.NewReader("{}"))
		w := httptest.NewRecorder()
		api.ServeHTTP(w, r)
		if w.Code != 401 {
			t.Fatalf("%s code=%d", path, w.Code)
		}
	}
	for _, body := range []string{`{"external_ref":"u","balance":"999"}`, `{"external_ref":"u"} {"extra":true}`, `null garbage`} {
		r := httptest.NewRequest("POST", "/v1/users", strings.NewReader(body))
		r.Header.Set("Authorization", "Bearer test-token-at-least-24-characters")
		w := httptest.NewRecorder()
		api.ServeHTTP(w, r)
		if w.Code != 400 {
			t.Fatal("invalid body accepted", w.Code)
		}
	}
}
