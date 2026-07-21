package games

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

const uniqueViolationCode = "23505"

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) ListByCollection(ctx context.Context, collectionID int64) ([]Game, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, name, is_official, visible
		 FROM games
		 WHERE collection_id = $1
		 ORDER BY is_official DESC, id`,
		collectionID,
	)
	if err != nil {
		return nil, fmt.Errorf("consultar jogos da coleção: %w", err)
	}
	defer rows.Close()

	found := make([]Game, 0)
	for rows.Next() {
		var game Game
		if err := rows.Scan(&game.ID, &game.Name, &game.IsOfficial, &game.Visible); err != nil {
			return nil, fmt.Errorf("ler jogo da coleção: %w", err)
		}
		found = append(found, game)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar jogos da coleção: %w", err)
	}

	return found, nil
}

func (r *Repository) Insert(ctx context.Context, collectionID int64, name string) (Game, error) {
	var created Game

	err := r.pool.QueryRow(ctx,
		`INSERT INTO games (collection_id, name, is_official)
		 VALUES ($1, $2, false)
		 RETURNING id, name, is_official, visible`,
		collectionID, name,
	).Scan(&created.ID, &created.Name, &created.IsOfficial, &created.Visible)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == uniqueViolationCode {
			return Game{}, ErrNameTaken
		}
		return Game{}, fmt.Errorf("inserir jogo: %w", err)
	}

	return created, nil
}

func (r *Repository) UpdateName(ctx context.Context, collectionID int64, gameID int64, name string) (Game, error) {
	var updated Game

	err := r.pool.QueryRow(ctx,
		`UPDATE games SET name = $3
		 WHERE id = $2 AND collection_id = $1
		 RETURNING id, name, is_official, visible`,
		collectionID, gameID, name,
	).Scan(&updated.ID, &updated.Name, &updated.IsOfficial, &updated.Visible)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Game{}, ErrNotFound
		}
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == uniqueViolationCode {
			return Game{}, ErrNameTaken
		}
		return Game{}, fmt.Errorf("atualizar nome do jogo: %w", err)
	}

	return updated, nil
}
