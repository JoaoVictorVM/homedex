package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"log/slog"
	"os"
	"time"

	"github.com/JoaoVictorVM/homedex/backend/internal/database"
)

const migrateTimeout = 30 * time.Second

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

	ctx, cancel := context.WithTimeout(context.Background(), migrateTimeout)
	defer cancel()

	pool, err := database.Connect(ctx, databaseURL)
	if err != nil {
		return fmt.Errorf("conectar ao Postgres: %w", err)
	}
	defer pool.Close()

	if err := database.Migrate(ctx, pool); err != nil {
		return fmt.Errorf("executar migrations: %w", err)
	}

	slog.Info("migrations aplicadas")

	return nil
}
