package collection

import (
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
