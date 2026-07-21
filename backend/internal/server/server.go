package server

import (
	"context"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"

	"github.com/JoaoVictorVM/homedex/backend/internal/collection"
	"github.com/JoaoVictorVM/homedex/backend/internal/games"
	"github.com/JoaoVictorVM/homedex/backend/internal/pokemon"
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

type Handlers struct {
	Collections *collection.Handler
	Games       *games.Handler
	Pokemons    *pokemon.Handler
}

func New(cfg Config, db Pinger, handlers Handlers) *http.Server {
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
	router.Route("/collections", handlers.Collections.Register)
	router.Route("/collections/{code}/games", handlers.Games.Register)
	router.Route("/collections/{code}/pokemons", handlers.Pokemons.Register)

	return &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}
}
