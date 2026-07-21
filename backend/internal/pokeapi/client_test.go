package pokeapi

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

type payload struct {
	Name string `json:"name"`
}

func TestGetSucesso(t *testing.T) {
	var gotPath, gotAccept, gotUserAgent string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotAccept = r.Header.Get("Accept")
		gotUserAgent = r.Header.Get("User-Agent")
		if _, err := w.Write([]byte(`{"name":"bulbasaur"}`)); err != nil {
			t.Errorf("escrever resposta: %v", err)
		}
	}))
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	var got payload
	if err := client.Get(context.Background(), "pokemon/bulbasaur", &got); err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	if got.Name != "bulbasaur" {
		t.Errorf("nome = %q, esperado %q", got.Name, "bulbasaur")
	}
	if gotPath != "/pokemon/bulbasaur" {
		t.Errorf("caminho = %q, esperado %q", gotPath, "/pokemon/bulbasaur")
	}
	if gotAccept != "application/json" {
		t.Errorf("Accept = %q", gotAccept)
	}
	if gotUserAgent != userAgent {
		t.Errorf("User-Agent = %q, esperado %q", gotUserAgent, userAgent)
	}
}

func TestGetNormalizaBarras(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/pokemon/pikachu" {
			t.Errorf("caminho = %q", r.URL.Path)
		}
		if _, err := w.Write([]byte(`{"name":"pikachu"}`)); err != nil {
			t.Errorf("escrever resposta: %v", err)
		}
	}))
	defer server.Close()

	client := New(Options{BaseURL: server.URL + "/"})

	var got payload
	if err := client.Get(context.Background(), "/pokemon/pikachu", &got); err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}
}

func TestGetNaoEncontrado(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	var got payload
	err := client.Get(context.Background(), "pokemon/inexistente", &got)
	if !errors.Is(err, ErrNotFound) {
		t.Errorf("erro = %v, esperado ErrNotFound", err)
	}
}

func TestGetErroDeServidor(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	var got payload
	err := client.Get(context.Background(), "pokemon/bulbasaur", &got)
	if err == nil {
		t.Fatal("esperado erro, obtido nil")
	}
	if errors.Is(err, ErrNotFound) {
		t.Error("erro de servidor não deve ser ErrNotFound")
	}
}

func TestGetRespostaInvalida(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		if _, err := w.Write([]byte(`isso não é json`)); err != nil {
			t.Errorf("escrever resposta: %v", err)
		}
	}))
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	var got payload
	if err := client.Get(context.Background(), "pokemon/bulbasaur", &got); err == nil {
		t.Fatal("esperado erro de decodificação, obtido nil")
	}
}

func TestGetRespeitaContext(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		if _, err := w.Write([]byte(`{"name":"bulbasaur"}`)); err != nil {
			t.Errorf("escrever resposta: %v", err)
		}
	}))
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	var got payload
	err := client.Get(ctx, "pokemon/bulbasaur", &got)
	if !errors.Is(err, context.Canceled) {
		t.Errorf("erro = %v, esperado context.Canceled", err)
	}
}
