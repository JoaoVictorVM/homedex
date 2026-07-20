package server

import (
	"context"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
)

const (
	rateLimitRequests = 100
	rateLimitWindow   = time.Minute
)

type Config struct {
	Port           string
	FrontendOrigin string
	TrustProxy     bool
}

type Pinger interface {
	Ping(ctx context.Context) error
}

func New(cfg Config, db Pinger) *http.Server {
	router := chi.NewRouter()

	router.Use(middleware.RequestID)
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{cfg.FrontendOrigin},
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Content-Type"},
		MaxAge:         300,
	}))
	router.Use(httprate.LimitBy(
		rateLimitRequests,
		rateLimitWindow,
		rateLimitKey(cfg.TrustProxy),
		httprate.WithLimitHandler(handleRateLimited),
	))

	router.Get("/health", handleHealth(db))

	return &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}
}
