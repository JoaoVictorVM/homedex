package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/JoaoVictorVM/homedex/backend/internal/database"
	"github.com/JoaoVictorVM/homedex/backend/internal/server"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return errors.New("variável de ambiente DATABASE_URL não definida")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	frontendOrigin := os.Getenv("FRONTEND_ORIGIN")
	if frontendOrigin == "" {
		frontendOrigin = "http://localhost:5173"
	}

	trustProxy := os.Getenv("TRUST_PROXY") == "true"

	bootCtx, cancelBoot := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelBoot()

	pool, err := database.Connect(bootCtx, databaseURL)
	if err != nil {
		return fmt.Errorf("conectar ao Postgres: %w", err)
	}
	defer pool.Close()

	if err := database.Migrate(bootCtx, pool); err != nil {
		return fmt.Errorf("executar migrations: %w", err)
	}

	srv := server.New(server.Config{
		Port:           port,
		FrontendOrigin: frontendOrigin,
		TrustProxy:     trustProxy,
	}, pool)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	serveErr := make(chan error, 1)
	go func() {
		serveErr <- srv.ListenAndServe()
	}()

	slog.Info("servidor iniciado", "porta", port)

	select {
	case err := <-serveErr:
		if !errors.Is(err, http.ErrServerClosed) {
			return fmt.Errorf("servidor http: %w", err)
		}
	case <-ctx.Done():
		shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("encerrar servidor: %w", err)
		}
	}

	return nil
}
