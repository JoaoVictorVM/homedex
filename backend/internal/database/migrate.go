package database

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"path"
	"sort"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	if _, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version text PRIMARY KEY,
			applied_at timestamptz NOT NULL DEFAULT now()
		)
	`); err != nil {
		return fmt.Errorf("criar tabela schema_migrations: %w", err)
	}

	names, err := fs.Glob(migrationsFS, "migrations/*.sql")
	if err != nil {
		return fmt.Errorf("listar migrations embedadas: %w", err)
	}
	sort.Strings(names)

	for _, name := range names {
		if err := apply(ctx, pool, name); err != nil {
			return fmt.Errorf("aplicar migration %s: %w", path.Base(name), err)
		}
	}

	return nil
}

func apply(ctx context.Context, pool *pgxpool.Pool, name string) error {
	version := path.Base(name)

	return InTx(ctx, pool, func(tx pgx.Tx) error {
		var exists bool
		if err := tx.QueryRow(ctx,
			`SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE version = $1)`,
			version,
		).Scan(&exists); err != nil {
			return fmt.Errorf("consultar schema_migrations: %w", err)
		}
		if exists {
			return nil
		}

		contents, err := migrationsFS.ReadFile(name)
		if err != nil {
			return fmt.Errorf("ler arquivo embedado: %w", err)
		}

		if _, err := tx.Exec(ctx, string(contents)); err != nil {
			return fmt.Errorf("executar SQL: %w", err)
		}

		if _, err := tx.Exec(ctx,
			`INSERT INTO schema_migrations (version) VALUES ($1)`,
			version,
		); err != nil {
			return fmt.Errorf("registrar versão aplicada: %w", err)
		}

		return nil
	})
}
