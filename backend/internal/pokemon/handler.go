package pokemon

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/JoaoVictorVM/homedex/backend/internal/collection"
	"github.com/JoaoVictorVM/homedex/backend/internal/httpjson"
	"github.com/JoaoVictorVM/homedex/backend/internal/pokeapi"
)

const maxBodySize = 8 << 10

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type createRequest struct {
	PokemonName string `json:"pokemonName"`
	Nickname    string `json:"nickname"`
	IsShiny     bool   `json:"isShiny"`
	Gender      string `json:"gender"`
	Form        string `json:"form"`
	GameID      int64  `json:"gameId"`
	BoxNumber   int    `json:"boxNumber"`
	Slot        int    `json:"slot"`
}

func (b createRequest) toNewPokemon() NewPokemon {
	return NewPokemon{
		EditPokemon: EditPokemon{
			PokemonName: b.PokemonName,
			Nickname:    b.Nickname,
			IsShiny:     b.IsShiny,
			Gender:      b.Gender,
			Form:        b.Form,
			GameID:      b.GameID,
		},
		BoxNumber: b.BoxNumber,
		Slot:      b.Slot,
	}
}

type editRequest struct {
	PokemonName string `json:"pokemonName"`
	Nickname    string `json:"nickname"`
	IsShiny     bool   `json:"isShiny"`
	Gender      string `json:"gender"`
	Form        string `json:"form"`
	GameID      int64  `json:"gameId"`
}

func (b editRequest) toEditPokemon() EditPokemon {
	return EditPokemon(b)
}

type positionRequest struct {
	BoxNumber *int `json:"boxNumber"`
	Slot      *int `json:"slot"`
}

func (h *Handler) Register(r chi.Router) {
	r.Get("/", h.listByBox)
	r.Post("/", h.create)
	r.Patch("/{pokemonID}", h.update)
	r.Patch("/{pokemonID}/position", h.move)
	r.Delete("/{pokemonID}", h.delete)
}

func (h *Handler) RegisterSprite(r chi.Router) {
	r.Get("/", h.sprite)
}

func (h *Handler) RegisterForms(r chi.Router) {
	r.Get("/", h.forms)
}

func (h *Handler) forms(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		httpjson.Error(w, http.StatusBadRequest, "informe o nome do pokémon")
		return
	}

	forms, err := h.service.ResolveForms(r.Context(), name)
	if err != nil {
		if errors.Is(err, pokeapi.ErrNotFound) || errors.Is(err, pokeapi.ErrInvalidName) {
			httpjson.Error(w, http.StatusNotFound, "pokémon não encontrado na PokéAPI")
			return
		}
		slog.Error("resolver formas", "erro", err)
		httpjson.Error(w, http.StatusInternalServerError, "não foi possível buscar as formas")
		return
	}

	httpjson.Write(w, http.StatusOK, map[string][]string{"forms": forms})
}

func (h *Handler) sprite(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		httpjson.Error(w, http.StatusBadRequest, "informe o nome do pokémon")
		return
	}

	form := r.URL.Query().Get("form")
	shiny := r.URL.Query().Get("shiny") == "true"

	url, err := h.service.ResolveSprite(r.Context(), name, form, shiny)
	if err != nil {
		if errors.Is(err, pokeapi.ErrNotFound) || errors.Is(err, pokeapi.ErrInvalidName) {
			httpjson.Error(w, http.StatusNotFound, "pokémon não encontrado na PokéAPI")
			return
		}
		slog.Error("resolver sprite", "erro", err)
		httpjson.Error(w, http.StatusInternalServerError, "não foi possível buscar a sprite")
		return
	}

	httpjson.Write(w, http.StatusOK, map[string]string{"sprite": url})
}

func (h *Handler) move(w http.ResponseWriter, r *http.Request) {
	pokemonID, err := strconv.ParseInt(chi.URLParam(r, "pokemonID"), 10, 64)
	if err != nil {
		httpjson.Error(w, http.StatusBadRequest, "identificador de pokémon inválido")
		return
	}

	var body positionRequest
	if err := decodeBody(w, r, &body); err != nil {
		httpjson.Error(w, http.StatusBadRequest, "corpo da requisição inválido")
		return
	}
	if body.BoxNumber == nil || body.Slot == nil {
		httpjson.Error(w, http.StatusBadRequest, "campos boxNumber e slot são obrigatórios")
		return
	}

	affected, err := h.service.Move(
		r.Context(), chi.URLParam(r, "code"), pokemonID, *body.BoxNumber, *body.Slot,
	)
	if err != nil {
		writeError(w, err, "mover pokémon")
		return
	}

	httpjson.Write(w, http.StatusOK, affected)
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	pokemonID, err := strconv.ParseInt(chi.URLParam(r, "pokemonID"), 10, 64)
	if err != nil {
		httpjson.Error(w, http.StatusBadRequest, "identificador de pokémon inválido")
		return
	}

	if err := h.service.Delete(r.Context(), chi.URLParam(r, "code"), pokemonID); err != nil {
		writeError(w, err, "remover pokémon")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	pokemonID, err := strconv.ParseInt(chi.URLParam(r, "pokemonID"), 10, 64)
	if err != nil {
		httpjson.Error(w, http.StatusBadRequest, "identificador de pokémon inválido")
		return
	}

	var body editRequest
	if err := decodeBody(w, r, &body); err != nil {
		httpjson.Error(w, http.StatusBadRequest, "corpo da requisição inválido")
		return
	}

	updated, err := h.service.Update(
		r.Context(), chi.URLParam(r, "code"), pokemonID, body.toEditPokemon(),
	)
	if err != nil {
		writeError(w, err, "editar pokémon")
		return
	}

	httpjson.Write(w, http.StatusOK, updated)
}

func (h *Handler) listByBox(w http.ResponseWriter, r *http.Request) {
	boxNumber := 1
	if raw := r.URL.Query().Get("box"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil {
			httpjson.Error(w, http.StatusBadRequest, "parâmetro box deve ser um número")
			return
		}
		boxNumber = parsed
	}

	found, err := h.service.ListByBox(r.Context(), chi.URLParam(r, "code"), boxNumber)
	if err != nil {
		writeError(w, err, "listar pokémon da box")
		return
	}

	httpjson.Write(w, http.StatusOK, found)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var body createRequest
	if err := decodeBody(w, r, &body); err != nil {
		httpjson.Error(w, http.StatusBadRequest, "corpo da requisição inválido")
		return
	}

	created, err := h.service.Create(r.Context(), chi.URLParam(r, "code"), body.toNewPokemon())
	if err != nil {
		writeError(w, err, "adicionar pokémon")
		return
	}

	httpjson.Write(w, http.StatusCreated, created)
}

func decodeBody(w http.ResponseWriter, r *http.Request, dst any) error {
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodySize))
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(dst); err != nil {
		return fmt.Errorf("decodificar corpo da requisição: %w", err)
	}

	return nil
}

func writeError(w http.ResponseWriter, err error, action string) {
	switch {
	case errors.Is(err, collection.ErrInvalidCode):
		httpjson.Error(w, http.StatusBadRequest,
			"código inválido: use 8 caracteres, sem os caracteres 0, O, 1 e I")
	case errors.Is(err, collection.ErrNotFound):
		httpjson.Error(w, http.StatusNotFound, "código de coleção não encontrado")
	case errors.Is(err, pokeapi.ErrNotFound), errors.Is(err, pokeapi.ErrInvalidName):
		httpjson.Error(w, http.StatusBadRequest, "pokémon não encontrado na PokéAPI")
	case errors.Is(err, ErrInvalidGender):
		httpjson.Error(w, http.StatusBadRequest,
			"sexo deve ser male, female ou genderless")
	case errors.Is(err, ErrInvalidName):
		httpjson.Error(w, http.StatusBadRequest, "informe o nome do pokémon")
	case errors.Is(err, ErrInvalidNickname):
		httpjson.Error(w, http.StatusBadRequest,
			"apelido deve ter no máximo 30 caracteres")
	case errors.Is(err, ErrInvalidForm):
		httpjson.Error(w, http.StatusBadRequest,
			"forma deve ter no máximo 60 caracteres")
	case errors.Is(err, ErrInvalidGame):
		httpjson.Error(w, http.StatusBadRequest, "informe o jogo do pokémon")
	case errors.Is(err, ErrInvalidPosition):
		httpjson.Error(w, http.StatusBadRequest,
			"box ou slot fora dos limites da coleção")
	case errors.Is(err, ErrGameNotFound):
		httpjson.Error(w, http.StatusNotFound, "jogo não encontrado nesta coleção")
	case errors.Is(err, ErrSlotTaken):
		httpjson.Error(w, http.StatusConflict, "já existe um pokémon nesse slot")
	case errors.Is(err, ErrNotFound):
		httpjson.Error(w, http.StatusNotFound, "pokémon não encontrado nesta coleção")
	default:
		slog.Error(action, "erro", err)
		httpjson.Error(w, http.StatusInternalServerError, "não foi possível "+action)
	}
}
