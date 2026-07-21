package pokeapi

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func spriteServer(t *testing.T, bodies map[string]string) *httptest.Server {
	t.Helper()

	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		name := strings.TrimPrefix(r.URL.Path, "/pokemon/")

		body, ok := bodies[name]
		if !ok {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		if _, err := w.Write([]byte(body)); err != nil {
			t.Errorf("escrever resposta: %v", err)
		}
	}))
}

func pokemonBody(name string, defaultSprite string, shinySprite string) string {
	return fmt.Sprintf(
		`{"id":1,"name":%q,"sprites":{"front_default":%q,"front_shiny":%q},"forms":[{"name":%q}]}`,
		name, defaultSprite, shinySprite, name,
	)
}

func TestSpriteNormalEShiny(t *testing.T) {
	server := spriteServer(t, map[string]string{
		"rattata": pokemonBody("rattata", "base.png", "base-shiny.png"),
	})
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	tests := map[string]struct {
		shiny bool
		want  string
	}{
		"normal": {shiny: false, want: "base.png"},
		"shiny":  {shiny: true, want: "base-shiny.png"},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			got, err := client.Sprite(context.Background(), "Rattata", "", tt.shiny)
			if err != nil {
				t.Fatalf("erro inesperado: %v", err)
			}
			if got != tt.want {
				t.Errorf("sprite = %q, esperado %q", got, tt.want)
			}
		})
	}
}

func TestSpriteDaForma(t *testing.T) {
	server := spriteServer(t, map[string]string{
		"rattata":       pokemonBody("rattata", "base.png", "base-shiny.png"),
		"rattata-alola": pokemonBody("rattata-alola", "alola.png", "alola-shiny.png"),
	})
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	tests := map[string]struct {
		shiny bool
		want  string
	}{
		"forma normal": {shiny: false, want: "alola.png"},
		"forma shiny":  {shiny: true, want: "alola-shiny.png"},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			got, err := client.Sprite(context.Background(), "rattata", "Rattata Alola", tt.shiny)
			if err != nil {
				t.Fatalf("erro inesperado: %v", err)
			}
			if got != tt.want {
				t.Errorf("sprite = %q, esperado %q", got, tt.want)
			}
		})
	}
}

func TestSpriteFallbackParaBase(t *testing.T) {
	server := spriteServer(t, map[string]string{
		"rattata":      pokemonBody("rattata", "base.png", "base-shiny.png"),
		"rattata-mega": pokemonBody("rattata-mega", "", ""),
	})
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	tests := map[string]struct {
		form string
		want string
	}{
		"forma inexistente":  {form: "rattata-hisui", want: "base.png"},
		"forma sem sprite":   {form: "rattata-mega", want: "base.png"},
		"forma igual à base": {form: "rattata", want: "base.png"},
		"forma inválida":     {form: "   ", want: "base.png"},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			got, err := client.Sprite(context.Background(), "rattata", tt.form, false)
			if err != nil {
				t.Fatalf("erro inesperado: %v", err)
			}
			if got != tt.want {
				t.Errorf("sprite = %q, esperado %q", got, tt.want)
			}
		})
	}
}

func TestSpriteShinyCaiParaNormalDaMesmaForma(t *testing.T) {
	server := spriteServer(t, map[string]string{
		"rattata":       pokemonBody("rattata", "base.png", "base-shiny.png"),
		"rattata-alola": pokemonBody("rattata-alola", "alola.png", ""),
	})
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	got, err := client.Sprite(context.Background(), "rattata", "rattata-alola", true)
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}
	if got != "alola.png" {
		t.Errorf("sprite = %q, esperado %q", got, "alola.png")
	}
}

func TestSpritePokemonInexistente(t *testing.T) {
	server := spriteServer(t, map[string]string{})
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	if _, err := client.Sprite(context.Background(), "missingno", "", false); !errors.Is(err, ErrNotFound) {
		t.Errorf("erro = %v, esperado ErrNotFound", err)
	}
}

func TestSpriteIndisponivel(t *testing.T) {
	server := spriteServer(t, map[string]string{
		"rattata": pokemonBody("rattata", "", ""),
	})
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	if _, err := client.Sprite(context.Background(), "rattata", "", false); !errors.Is(err, ErrNoSprite) {
		t.Errorf("erro = %v, esperado ErrNoSprite", err)
	}
}
