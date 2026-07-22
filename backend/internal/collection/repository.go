package collection

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/JoaoVictorVM/homedex/backend/internal/database"
)

const (
	uniqueViolationCode = "23505"

	MaxBoxes = 32
)

var (
	errCodeTaken = errors.New("código de coleção já existe")

	ErrNotFound = errors.New("coleção não encontrada")
	ErrMaxBoxes = errors.New("limite de boxes da coleção atingido")
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Insert(ctx context.Context, code string, officialGames []string) (Collection, error) {
	var created Collection

	err := database.InTx(ctx, r.pool, func(tx pgx.Tx) error {
		err := tx.QueryRow(ctx,
			`INSERT INTO collections (code) VALUES ($1)
			 RETURNING id, code, box_count, created_at`,
			code,
		).Scan(&created.ID, &created.Code, &created.BoxCount, &created.CreatedAt)
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == uniqueViolationCode {
				return errCodeTaken
			}
			return fmt.Errorf("inserir coleção: %w", err)
		}

		if _, err := tx.Exec(ctx,
			`INSERT INTO games (collection_id, name, is_official)
			 SELECT $1, unnest($2::text[]), true`,
			created.ID, officialGames,
		); err != nil {
			return fmt.Errorf("inserir jogos oficiais: %w", err)
		}

		return nil
	})
	if err != nil {
		if errors.Is(err, errCodeTaken) {
			return Collection{}, errCodeTaken
		}
		return Collection{}, fmt.Errorf("criar coleção com jogos oficiais: %w", err)
	}

	return created, nil
}

func (r *Repository) AddBox(ctx context.Context, code string) (Collection, error) {
	var updated Collection

	err := r.pool.QueryRow(ctx,
		`UPDATE collections SET box_count = box_count + 1
		 WHERE code = $1 AND box_count < $2
		 RETURNING id, code, box_count, created_at`,
		code, MaxBoxes,
	).Scan(&updated.ID, &updated.Code, &updated.BoxCount, &updated.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Collection{}, r.addBoxRejection(ctx, code)
		}
		return Collection{}, fmt.Errorf("adicionar box: %w", err)
	}

	return updated, nil
}

func (r *Repository) addBoxRejection(ctx context.Context, code string) error {
	if _, err := r.FindByCode(ctx, code); err != nil {
		return err
	}

	return ErrMaxBoxes
}

func (r *Repository) FindByCode(ctx context.Context, code string) (Collection, error) {
	var found Collection

	err := r.pool.QueryRow(ctx,
		`SELECT id, code, box_count, created_at
		 FROM collections
		 WHERE code = $1`,
		code,
	).Scan(&found.ID, &found.Code, &found.BoxCount, &found.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Collection{}, ErrNotFound
		}
		return Collection{}, fmt.Errorf("buscar coleção por código: %w", err)
	}

	return found, nil
}
