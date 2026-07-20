package httpjson

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

func Write(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(body); err != nil {
		slog.Error("escrever resposta json", "erro", err)
	}
}

func Error(w http.ResponseWriter, status int, message string) {
	Write(w, status, map[string]string{"error": message})
}
