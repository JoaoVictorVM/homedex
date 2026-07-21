package pokeapi

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

const bulbasaurBody = `{
	"id": 1,
	"name": "bulbasaur",
	"sprites": {
		"front_default": "https://sprites/1.png",
		"front_shiny": "https://sprites/shiny/1.png"
	},
	"forms": [{"name": "bulbasaur"}]
}`

func TestPokemon(t *testing.T) {
	var gotPath string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		if _, err := w.Write([]byte(bulbasaurBody)); err != nil {
			t.Errorf("escrever resposta: %v", err)
		}
	}))
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	got, err := client.Pokemon(context.Background(), "  Bulbasaur ")
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	if gotPath != "/pokemon/bulbasaur" {
		t.Errorf("caminho = %q", gotPath)
	}
	if got.ID != 1 || got.Name != "bulbasaur" {
		t.Errorf("pokémon = %+v", got)
	}
	if got.Sprites.Default != "https://sprites/1.png" {
		t.Errorf("sprite padrão = %q", got.Sprites.Default)
	}
	if got.Sprites.Shiny != "https://sprites/shiny/1.png" {
		t.Errorf("sprite shiny = %q", got.Sprites.Shiny)
	}
	if len(got.Forms) != 1 || got.Forms[0] != "bulbasaur" {
		t.Errorf("formas = %v", got.Forms)
	}
}

func TestPokemonCaiParaVariedadePadraoDaEspecie(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/pokemon/deoxys":
			w.WriteHeader(http.StatusNotFound)
		case "/pokemon-species/deoxys":
			if _, err := w.Write([]byte(
				`{"varieties":[{"is_default":false,"pokemon":{"name":"deoxys-attack"}},` +
					`{"is_default":true,"pokemon":{"name":"deoxys-normal"}}]}`,
			)); err != nil {
				t.Errorf("escrever resposta: %v", err)
			}
		case "/pokemon/deoxys-normal":
			if _, err := w.Write([]byte(
				`{"id":386,"name":"deoxys-normal","sprites":{"front_default":"386.png","front_shiny":"shiny-386.png"},"forms":[{"name":"deoxys-normal"}]}`,
			)); err != nil {
				t.Errorf("escrever resposta: %v", err)
			}
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	got, err := client.Pokemon(context.Background(), "Deoxys")
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}
	if got.Name != "deoxys-normal" || got.Sprites.Default != "386.png" {
		t.Errorf("pokémon = %+v", got)
	}
}

func TestPokemonInexistente(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	if _, err := client.Pokemon(context.Background(), "missingno"); !errors.Is(err, ErrNotFound) {
		t.Errorf("erro = %v, esperado ErrNotFound", err)
	}
}

func TestPokemonNomeInvalidoNaoChamaAPI(t *testing.T) {
	called := false

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	if _, err := client.Pokemon(context.Background(), "   "); !errors.Is(err, ErrInvalidName) {
		t.Errorf("erro = %v, esperado ErrInvalidName", err)
	}
	if called {
		t.Error("nome inválido não deve gerar chamada à PokéAPI")
	}
}

func TestNormalizeNameValido(t *testing.T) {
	tests := map[string]struct {
		input string
		want  string
	}{
		"simples":          {input: "Pikachu", want: "pikachu"},
		"com espaços":      {input: "  Mr Mime  ", want: "mr-mime"},
		"com ponto":        {input: "Mr. Mime", want: "mr-mime"},
		"com apóstrofo":    {input: "Farfetch'd", want: "farfetchd"},
		"já normalizado":   {input: "ho-oh", want: "ho-oh"},
		"underscore":       {input: "tapu_koko", want: "tapu-koko"},
		"maiúsculas":       {input: "CHARIZARD", want: "charizard"},
		"forma com número": {input: "Rotom 2", want: "rotom-2"},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			got, err := NormalizeName(tt.input)
			if err != nil {
				t.Fatalf("erro inesperado: %v", err)
			}
			if got != tt.want {
				t.Errorf("NormalizeName(%q) = %q, esperado %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestNormalizeNameInvalido(t *testing.T) {
	tests := map[string]string{
		"vazio":            "",
		"só espaços":       "   ",
		"só pontuação":     "...",
		"caractere ilegal": "pikachu/../admin",
		"acentuado":        "pokémon",
	}

	for name, input := range tests {
		t.Run(name, func(t *testing.T) {
			if _, err := NormalizeName(input); !errors.Is(err, ErrInvalidName) {
				t.Errorf("NormalizeName(%q) erro = %v, esperado ErrInvalidName", input, err)
			}
		})
	}
}
