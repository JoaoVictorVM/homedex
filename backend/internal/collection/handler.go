package collection

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/JoaoVictorVM/homedex/backend/internal/httpjson"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Register(r chi.Router) {
	r.Post("/", h.create)
	r.Get("/{code}", h.get)
	r.Post("/{code}/boxes", h.addBox)
}

func (h *Handler) addBox(w http.ResponseWriter, r *http.Request) {
	updated, err := h.service.AddBox(r.Context(), chi.URLParam(r, "code"))
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidCode):
			httpjson.Error(w, http.StatusBadRequest,
				"código inválido: use 8 caracteres, sem os caracteres 0, O, 1 e I")
		case errors.Is(err, ErrNotFound):
			httpjson.Error(w, http.StatusNotFound, "código de coleção não encontrado")
		case errors.Is(err, ErrMaxBoxes):
			httpjson.Error(w, http.StatusConflict,
				"limite de 32 boxes atingido")
		default:
			slog.Error("adicionar box", "erro", err)
			httpjson.Error(w, http.StatusInternalServerError, "não foi possível adicionar a box")
		}
		return
	}

	httpjson.Write(w, http.StatusOK, updated)
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	found, err := h.service.Get(r.Context(), code)
	if err != nil {
		if errors.Is(err, ErrInvalidCode) {
			httpjson.Error(w, http.StatusBadRequest,
				"código inválido: use 8 caracteres, sem os caracteres 0, O, 1 e I")
			return
		}
		if errors.Is(err, ErrNotFound) {
			httpjson.Error(w, http.StatusNotFound, "código de coleção não encontrado")
			return
		}
		slog.Error("buscar coleção", "erro", err)
		httpjson.Error(w, http.StatusInternalServerError, "não foi possível buscar a coleção")
		return
	}

	httpjson.Write(w, http.StatusOK, found)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	created, err := h.service.Create(r.Context())
	if err != nil {
		slog.Error("criar coleção", "erro", err)
		httpjson.Error(w, http.StatusInternalServerError, "não foi possível criar a coleção")
		return
	}

	httpjson.Write(w, http.StatusCreated, created)
}
