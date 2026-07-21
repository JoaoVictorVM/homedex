package games

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

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
