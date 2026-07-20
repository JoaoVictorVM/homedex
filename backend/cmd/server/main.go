package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/JoaoVictorVM/homedex/backend/internal/database"
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

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := database.Connect(ctx, databaseURL)
	if err != nil {
		return fmt.Errorf("conectar ao Postgres: %w", err)
	}
	defer pool.Close()

	fmt.Println("conexão com o Postgres estabelecida")

	return nil
}
