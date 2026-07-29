package server

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

type spyPinger struct {
	calls int
	err   error
}

func (p *spyPinger) Ping(context.Context) error {
	p.calls++
	return p.err
}

func TestLivenessNaoConsultaBanco(t *testing.T) {
	db := &spyPinger{}
	rec := httptest.NewRecorder()

	req := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/health", nil)

	handleLiveness()(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, esperado %d", rec.Code, http.StatusOK)
	}
	if db.calls != 0 {
		t.Errorf("pings no banco = %d, esperado 0", db.calls)
	}
}

func TestDatabaseHealth(t *testing.T) {
	tests := map[string]struct {
		pingErr    error
		wantStatus int
	}{
		"banco disponível":   {pingErr: nil, wantStatus: http.StatusOK},
		"banco indisponível": {pingErr: errors.New("sem conexão"), wantStatus: http.StatusServiceUnavailable},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			db := &spyPinger{err: tt.pingErr}
			rec := httptest.NewRecorder()

			req := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/health/db", nil)

			handleDatabaseHealth(db)(rec, req)

			if rec.Code != tt.wantStatus {
				t.Errorf("status = %d, esperado %d", rec.Code, tt.wantStatus)
			}
			if db.calls != 1 {
				t.Errorf("pings no banco = %d, esperado 1", db.calls)
			}
		})
	}
}
