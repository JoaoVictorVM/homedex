package pokemon

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/JoaoVictorVM/homedex/backend/internal/database"
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

func (r *Repository) Update(ctx context.Context, collectionID int64, pokemonID int64, edit EditPokemon) (Pokemon, error) {
	var updated Pokemon

	err := r.pool.QueryRow(ctx,
		`UPDATE pokemons p
		 SET pokemon_name = $4, nickname = NULLIF($5, ''), is_shiny = $6,
			gender = $7, form = NULLIF($8, ''), game_id = g.id
		 FROM games g
		 WHERE p.id = $2 AND p.collection_id = $1
			AND g.id = $3 AND g.collection_id = $1
		 RETURNING p.id, p.pokemon_name, COALESCE(p.nickname, ''), p.is_shiny, p.gender,
			COALESCE(p.form, ''), p.game_id, p.box_number, p.slot`,
		collectionID, pokemonID, edit.GameID, edit.PokemonName, edit.Nickname,
		edit.IsShiny, edit.Gender, edit.Form,
	).Scan(&updated.ID, &updated.PokemonName, &updated.Nickname, &updated.IsShiny,
		&updated.Gender, &updated.Form, &updated.GameID, &updated.BoxNumber, &updated.Slot)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Pokemon{}, r.rejectionReason(ctx, collectionID, pokemonID)
		}
		return Pokemon{}, fmt.Errorf("atualizar pokémon: %w", err)
	}

	return updated, nil
}

func (r *Repository) UpdatePosition(ctx context.Context, collectionID int64, pokemonID int64, boxNumber int, slot int) ([]Pokemon, error) {
	var affected []Pokemon

	err := database.InTx(ctx, r.pool, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `SET CONSTRAINTS pokemons_position_unique DEFERRED`); err != nil {
			return fmt.Errorf("adiar constraint de posição: %w", err)
		}

		var currentBox, currentSlot int
		err := tx.QueryRow(ctx,
			`SELECT box_number, slot FROM pokemons
			 WHERE id = $2 AND collection_id = $1
			 FOR UPDATE`,
			collectionID, pokemonID,
		).Scan(&currentBox, &currentSlot)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrNotFound
			}
			return fmt.Errorf("consultar posição atual: %w", err)
		}

		var occupantID int64
		err = tx.QueryRow(ctx,
			`SELECT id FROM pokemons
			 WHERE collection_id = $1 AND box_number = $2 AND slot = $3
			 FOR UPDATE`,
			collectionID, boxNumber, slot,
		).Scan(&occupantID)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("consultar ocupante do slot: %w", err)
		}

		swap := err == nil && occupantID != pokemonID

		moved, err := movePokemon(ctx, tx, collectionID, pokemonID, boxNumber, slot)
		if err != nil {
			return err
		}
		affected = append(affected, moved)

		if swap {
			swapped, err := movePokemon(ctx, tx, collectionID, occupantID, currentBox, currentSlot)
			if err != nil {
				return err
			}
			affected = append(affected, swapped)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return affected, nil
}

func movePokemon(ctx context.Context, tx pgx.Tx, collectionID int64, pokemonID int64, boxNumber int, slot int) (Pokemon, error) {
	var moved Pokemon

	err := tx.QueryRow(ctx,
		`UPDATE pokemons SET box_number = $3, slot = $4
		 WHERE id = $2 AND collection_id = $1
		 RETURNING id, pokemon_name, COALESCE(nickname, ''), is_shiny, gender,
			COALESCE(form, ''), game_id, box_number, slot`,
		collectionID, pokemonID, boxNumber, slot,
	).Scan(&moved.ID, &moved.PokemonName, &moved.Nickname, &moved.IsShiny, &moved.Gender,
		&moved.Form, &moved.GameID, &moved.BoxNumber, &moved.Slot)
	if err != nil {
		return Pokemon{}, fmt.Errorf("mover pokémon: %w", err)
	}

	return moved, nil
}

func (r *Repository) Delete(ctx context.Context, collectionID int64, pokemonID int64) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM pokemons WHERE id = $2 AND collection_id = $1`,
		collectionID, pokemonID,
	)
	if err != nil {
		return fmt.Errorf("remover pokémon: %w", err)
	}

	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}

func (r *Repository) rejectionReason(ctx context.Context, collectionID int64, pokemonID int64) error {
	var exists bool

	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS (SELECT 1 FROM pokemons WHERE id = $2 AND collection_id = $1)`,
		collectionID, pokemonID,
	).Scan(&exists)
	if err != nil {
		return fmt.Errorf("consultar pokémon: %w", err)
	}

	if !exists {
		return ErrNotFound
	}

	return ErrGameNotFound
}
