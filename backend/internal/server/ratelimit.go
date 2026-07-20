package server

import (
	"net"
	"net/http"
	"strings"

	"github.com/go-chi/httprate"
)

func handleRateLimited(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusTooManyRequests, map[string]string{
		"error": "muitas requisições, tente novamente em instantes",
	})
}

func rateLimitKey(trustProxy bool) httprate.KeyFunc {
	return func(r *http.Request) (string, error) {
		if trustProxy {
			if ip := lastForwardedIP(r); ip != "" {
				return httprate.CanonicalizeIP(ip), nil
			}
		}

		host, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			return httprate.CanonicalizeIP(r.RemoteAddr), nil
		}

		return httprate.CanonicalizeIP(host), nil
	}
}

func lastForwardedIP(r *http.Request) string {
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded == "" {
		return ""
	}

	parts := strings.Split(forwarded, ",")

	return strings.TrimSpace(parts[len(parts)-1])
}
