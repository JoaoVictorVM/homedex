package pokemon

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

func (r *Repository) Insert(ctx context.Context, collectionID int64, novo NewPokemon) (Pokemon, error) {
	var created Pokemon

	err := r.pool.QueryRow(ctx,
		`INSERT INTO pokemons
			(collection_id, game_id, pokemon_name, nickname, is_shiny, gender, form, box_number, slot)
		 SELECT $1, g.id, $3, NULLIF($4, ''), $5, $6, NULLIF($7, ''), $8, $9
		 FROM games g
		 WHERE g.id = $2 AND g.collection_id = $1
		 RETURNING id, pokemon_name, COALESCE(nickname, ''), is_shiny, gender,
			COALESCE(form, ''), game_id, box_number, slot`,
		collectionID, novo.GameID, novo.PokemonName, novo.Nickname, novo.IsShiny,
		novo.Gender, novo.Form, novo.BoxNumber, novo.Slot,
	).Scan(&created.ID, &created.PokemonName, &created.Nickname, &created.IsShiny,
		&created.Gender, &created.Form, &created.GameID, &created.BoxNumber, &created.Slot)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Pokemon{}, ErrGameNotFound
		}
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == uniqueViolationCode {
			return Pokemon{}, ErrSlotTaken
		}
		return Pokemon{}, fmt.Errorf("inserir pokémon: %w", err)
	}

	return created, nil
}
