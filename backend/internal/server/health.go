package server

import (
	"net/http"

	"github.com/JoaoVictorVM/homedex/backend/internal/httpjson"
)

func handleHealth(db Pinger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := db.Ping(r.Context()); err != nil {
			httpjson.Write(w, http.StatusServiceUnavailable, map[string]string{
				"status": "unavailable",
			})
			return
		}

		httpjson.Write(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}
