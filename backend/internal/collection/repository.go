package collection

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

const uniqueViolationCode = "23505"

var errCodeTaken = errors.New("código de coleção já existe")

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Insert(ctx context.Context, code string) (Collection, error) {
	var created Collection

	err := r.pool.QueryRow(ctx,
		`INSERT INTO collections (code) VALUES ($1)
		 RETURNING id, code, box_count, created_at`,
		code,
	).Scan(&created.ID, &created.Code, &created.BoxCount, &created.CreatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == uniqueViolationCode {
			return Collection{}, errCodeTaken
		}
		return Collection{}, fmt.Errorf("inserir coleção: %w", err)
	}

	return created, nil
}
