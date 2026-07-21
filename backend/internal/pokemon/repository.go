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

func (r *Repository) ListByBox(ctx context.Context, collectionID int64, boxNumber int) ([]Pokemon, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, pokemon_name, COALESCE(nickname, ''), is_shiny, gender,
			COALESCE(form, ''), game_id, box_number, slot
		 FROM pokemons
		 WHERE collection_id = $1 AND box_number = $2
		 ORDER BY slot`,
		collectionID, boxNumber,
	)
	if err != nil {
		return nil, fmt.Errorf("consultar pokémon da box: %w", err)
	}
	defer rows.Close()

	found := make([]Pokemon, 0, SlotsPerBox)
	for rows.Next() {
		var p Pokemon
		if err := rows.Scan(&p.ID, &p.PokemonName, &p.Nickname, &p.IsShiny, &p.Gender,
			&p.Form, &p.GameID, &p.BoxNumber, &p.Slot); err != nil {
			return nil, fmt.Errorf("ler pokémon da box: %w", err)
		}
		found = append(found, p)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar pokémon da box: %w", err)
	}

	return found, nil
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
