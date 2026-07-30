package pokemon

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"

	"github.com/JoaoVictorVM/homedex/backend/internal/collection"
	"github.com/JoaoVictorVM/homedex/backend/internal/database"
	"github.com/JoaoVictorVM/homedex/backend/internal/httpjson"
)

var (
	ErrDailyRollClaimed = errors.New("resgate diário já utilizado hoje")
	ErrCollectionFull   = errors.New("coleção sem slots livres")
)

type DailyRoll struct {
	PokemonName string
	IsShiny     bool
	Gender      string
	Form        string
}

func (d DailyRoll) normalized() (DailyRoll, error) {
	d.PokemonName = collapseSpaces(d.PokemonName)
	if d.PokemonName == "" {
		return DailyRoll{}, ErrInvalidName
	}

	d.Form = collapseSpaces(d.Form)
	if utf8.RuneCountInString(d.Form) > maxFormLength {
		return DailyRoll{}, ErrInvalidForm
	}

	if !validGender(d.Gender) {
		return DailyRoll{}, ErrInvalidGender
	}

	return d, nil
}

func (r *Repository) RedeemDailyRoll(
	ctx context.Context, collectionID int64, novo DailyRoll,
) (Pokemon, time.Time, error) {
	var created Pokemon
	var proximoResgate time.Time

	err := database.InTx(ctx, r.pool, func(tx pgx.Tx) error {
		var boxCount int
		var jaResgatouHoje bool

		err := tx.QueryRow(ctx,
			`SELECT box_count,
			        last_roll_claimed_at IS NOT NULL
			          AND (last_roll_claimed_at AT TIME ZONE 'UTC')::date
			              = (now() AT TIME ZONE 'UTC')::date,
			        ((now() AT TIME ZONE 'UTC')::date + 1)::timestamp AT TIME ZONE 'UTC'
			 FROM collections
			 WHERE id = $1
			 FOR UPDATE`,
			collectionID,
		).Scan(&boxCount, &jaResgatouHoje, &proximoResgate)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return collection.ErrNotFound
			}
			return fmt.Errorf("bloquear coleção para o resgate diário: %w", err)
		}

		if jaResgatouHoje {
			return ErrDailyRollClaimed
		}

		var boxNumber int
		var slot int

		err = tx.QueryRow(ctx,
			`SELECT b.box_number, s.slot
			 FROM generate_series(1, $2) AS b(box_number)
			 CROSS JOIN generate_series(0, $3) AS s(slot)
			 WHERE NOT EXISTS (
			     SELECT 1 FROM pokemons p
			     WHERE p.collection_id = $1
			       AND p.box_number = b.box_number
			       AND p.slot = s.slot
			 )
			 ORDER BY b.box_number, s.slot
			 LIMIT 1`,
			collectionID, boxCount, SlotsPerBox-1,
		).Scan(&boxNumber, &slot)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrCollectionFull
			}
			return fmt.Errorf("procurar slot livre: %w", err)
		}

		err = tx.QueryRow(ctx,
			`INSERT INTO pokemons
				(collection_id, game_id, pokemon_name, is_shiny, gender, form, box_number, slot)
			 SELECT $1, g.id, $2, $3, $4, NULLIF($5, ''), $6, $7
			 FROM games g
			 WHERE g.collection_id = $1 AND g.is_system
			 RETURNING id, pokemon_name, COALESCE(nickname, ''), is_shiny, gender,
				COALESCE(form, ''), game_id, box_number, slot`,
			collectionID, novo.PokemonName, novo.IsShiny, novo.Gender, novo.Form, boxNumber, slot,
		).Scan(&created.ID, &created.PokemonName, &created.Nickname, &created.IsShiny,
			&created.Gender, &created.Form, &created.GameID, &created.BoxNumber, &created.Slot)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrGameNotFound
			}
			return fmt.Errorf("inserir pokémon do resgate diário: %w", err)
		}

		if _, err := tx.Exec(ctx,
			`UPDATE collections SET last_roll_claimed_at = now() WHERE id = $1`,
			collectionID,
		); err != nil {
			return fmt.Errorf("registrar resgate diário: %w", err)
		}

		return nil
	})
	if err != nil {
		return Pokemon{}, proximoResgate, err
	}

	return created, proximoResgate, nil
}

func (s *Service) RedeemDailyRoll(
	ctx context.Context, rawCode string, novo DailyRoll,
) (Pokemon, time.Time, error) {
	owner, err := s.collections.Get(ctx, rawCode)
	if err != nil {
		return Pokemon{}, time.Time{}, err
	}

	normalizado, err := novo.normalized()
	if err != nil {
		return Pokemon{}, time.Time{}, err
	}

	return s.repo.RedeemDailyRoll(ctx, owner.ID, normalizado)
}

type dailyRollRequest struct {
	Species string `json:"species"`
	Gender  string `json:"gender"`
	Shiny   bool   `json:"shiny"`
	Form    string `json:"form"`
}

func (b dailyRollRequest) toDailyRoll() DailyRoll {
	return DailyRoll{
		PokemonName: b.Species,
		IsShiny:     b.Shiny,
		Gender:      b.Gender,
		Form:        b.Form,
	}
}

func (h *Handler) RegisterDailyRoll(r chi.Router) {
	r.Post("/", h.dailyRoll)
}

func (h *Handler) dailyRoll(w http.ResponseWriter, r *http.Request) {
	var body dailyRollRequest
	if err := decodeBody(w, r, &body); err != nil {
		httpjson.Error(w, http.StatusBadRequest, "corpo da requisição inválido")
		return
	}

	created, proximoResgate, err := h.service.RedeemDailyRoll(
		r.Context(), chi.URLParam(r, "code"), body.toDailyRoll(),
	)
	if err != nil {
		writeDailyRollError(w, err, proximoResgate)
		return
	}

	httpjson.Write(w, http.StatusCreated, created)
}

func writeDailyRollError(w http.ResponseWriter, err error, proximoResgate time.Time) {
	switch {
	case errors.Is(err, collection.ErrInvalidCode):
		httpjson.Error(w, http.StatusBadRequest,
			"código inválido: use 8 caracteres, sem os caracteres 0, O, 1 e I")
	case errors.Is(err, collection.ErrNotFound):
		httpjson.Error(w, http.StatusNotFound, "código de coleção não encontrado")
	case errors.Is(err, ErrInvalidName):
		httpjson.Error(w, http.StatusBadRequest, "nome do pokémon é obrigatório")
	case errors.Is(err, ErrInvalidGender):
		httpjson.Error(w, http.StatusBadRequest, "sexo deve ser male, female ou genderless")
	case errors.Is(err, ErrInvalidForm):
		httpjson.Error(w, http.StatusBadRequest, "forma inválida")
	case errors.Is(err, ErrDailyRollClaimed):
		httpjson.Write(w, http.StatusConflict, map[string]any{
			"error":           "o resgate diário desta coleção já foi utilizado hoje",
			"nextAvailableAt": proximoResgate.UTC(),
		})
	case errors.Is(err, ErrCollectionFull):
		httpjson.Error(w, http.StatusUnprocessableEntity,
			"a coleção não tem mais slots livres")
	case errors.Is(err, ErrGameNotFound):
		httpjson.Error(w, http.StatusInternalServerError,
			"a coleção não tem o jogo HomeDex do sistema")
	default:
		slog.Error("resgatar roll diário", "erro", err)
		httpjson.Error(w, http.StatusInternalServerError, "não foi possível resgatar o roll diário")
	}
}
