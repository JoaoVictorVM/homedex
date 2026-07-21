package pokemon

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/JoaoVictorVM/homedex/backend/internal/collection"
	"github.com/JoaoVictorVM/homedex/backend/internal/httpjson"
	"github.com/JoaoVictorVM/homedex/backend/internal/pokeapi"
)

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
	return NewPokemon(b)
}

func (h *Handler) Register(r chi.Router) {
	r.Post("/", h.create)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var body createRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
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

func writeError(w http.ResponseWriter, err error, action string) {
	switch {
	case errors.Is(err, collection.ErrInvalidCode):
		httpjson.Error(w, http.StatusBadRequest,
			"código inválido: use 8 caracteres, sem os caracteres 0, O, 1, I e L")
	case errors.Is(err, collection.ErrNotFound):
		httpjson.Error(w, http.StatusNotFound, "código de coleção não encontrado")
	case errors.Is(err, pokeapi.ErrNotFound), errors.Is(err, pokeapi.ErrInvalidName):
		httpjson.Error(w, http.StatusBadRequest, "pokémon não encontrado na PokéAPI")
	case errors.Is(err, ErrInvalidGender):
		httpjson.Error(w, http.StatusBadRequest,
			"sexo deve ser male, female ou genderless")
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
