package games

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

const SystemGameName = "HomeDex"

var ErrSystem = errors.New("jogo do sistema não pode ser renomeado, ocultado nem excluído")

func (r *Repository) SystemGameID(ctx context.Context, collectionID int64) (int64, error) {
	var id int64

	err := r.pool.QueryRow(ctx,
		`SELECT id FROM games WHERE collection_id = $1 AND is_system`,
		collectionID,
	).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, ErrNotFound
		}
		return 0, fmt.Errorf("consultar jogo do sistema: %w", err)
	}

	return id, nil
}
