package games

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/JoaoVictorVM/homedex/backend/internal/collection"
	"github.com/JoaoVictorVM/homedex/backend/internal/httpjson"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type createRequest struct {
	Name string `json:"name"`
}

func (h *Handler) Register(r chi.Router) {
	r.Get("/", h.list)
	r.Post("/", h.create)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var body createRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httpjson.Error(w, http.StatusBadRequest, "corpo da requisição inválido")
		return
	}

	created, err := h.service.Create(r.Context(), chi.URLParam(r, "code"), body.Name)
	if err != nil {
		writeError(w, err, "cadastrar jogo")
		return
	}

	httpjson.Write(w, http.StatusCreated, created)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	found, err := h.service.List(r.Context(), code)
	if err != nil {
		writeError(w, err, "listar jogos")
		return
	}

	httpjson.Write(w, http.StatusOK, found)
}

func writeError(w http.ResponseWriter, err error, action string) {
	switch {
	case errors.Is(err, collection.ErrInvalidCode):
		httpjson.Error(w, http.StatusBadRequest,
			"código inválido: use 8 caracteres, sem os caracteres 0, O, 1, I e L")
	case errors.Is(err, collection.ErrNotFound):
		httpjson.Error(w, http.StatusNotFound, "código de coleção não encontrado")
	case errors.Is(err, ErrInvalidName):
		httpjson.Error(w, http.StatusBadRequest,
			"nome do jogo deve ter entre 1 e 60 caracteres")
	case errors.Is(err, ErrNameTaken):
		httpjson.Error(w, http.StatusConflict,
			"já existe um jogo com esse nome nesta coleção")
	default:
		slog.Error(action, "erro", err)
		httpjson.Error(w, http.StatusInternalServerError, "não foi possível "+action)
	}
}
