package pokemon

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"github.com/JoaoVictorVM/homedex/backend/internal/pokeapi"
)

type pokedexFalsa struct {
	imagem []byte
	erro   error

	nomeRecebido  string
	formaRecebida string
	shinyRecebido bool
}

func (p *pokedexFalsa) Pokemon(context.Context, string) (pokeapi.Pokemon, error) {
	return pokeapi.Pokemon{}, nil
}

func (p *pokedexFalsa) Sprite(context.Context, string, string, bool) (string, error) {
	return "", nil
}

func (p *pokedexFalsa) Forms(context.Context, string) ([]string, error) {
	return nil, nil
}

func (p *pokedexFalsa) SpriteImage(_ context.Context, name string, form string, shiny bool) ([]byte, error) {
	p.nomeRecebido = name
	p.formaRecebida = form
	p.shinyRecebido = shiny

	if p.erro != nil {
		return nil, p.erro
	}

	return p.imagem, nil
}

func servidorDeSprite(pokedex *pokedexFalsa) http.Handler {
	handler := NewHandler(NewService(nil, nil, pokedex))

	router := chi.NewRouter()
	router.Route("/sprite", handler.RegisterSprite)

	return router
}

func TestSpriteImageRetornaOsBytesComContentTypeDeImagem(t *testing.T) {
	imagem := []byte("\x89PNG\r\n\x1a\n conteúdo falso de png")
	pokedex := &pokedexFalsa{imagem: imagem}

	req := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/sprite/image?name=pikachu", nil)
	rec := httptest.NewRecorder()

	servidorDeSprite(pokedex).ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, esperado 200", rec.Code)
	}
	if got := rec.Header().Get("Content-Type"); got != "image/png" {
		t.Errorf("Content-Type = %q, esperado %q", got, "image/png")
	}
	if rec.Body.String() != string(imagem) {
		t.Errorf("corpo diferente da imagem servida")
	}
	if rec.Header().Get("Cache-Control") == "" {
		t.Error("resposta sem Cache-Control")
	}
}

func TestSpriteImageRepassaShinyEForma(t *testing.T) {
	pokedex := &pokedexFalsa{imagem: []byte("png")}

	req := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/sprite/image?name=pikachu&form=pikachu-gmax&shiny=true", nil)
	servidorDeSprite(pokedex).ServeHTTP(httptest.NewRecorder(), req)

	if pokedex.nomeRecebido != "pikachu" {
		t.Errorf("nome = %q, esperado %q", pokedex.nomeRecebido, "pikachu")
	}
	if pokedex.formaRecebida != "pikachu-gmax" {
		t.Errorf("forma = %q, esperado %q", pokedex.formaRecebida, "pikachu-gmax")
	}
	if !pokedex.shinyRecebido {
		t.Error("shiny = false, esperado true")
	}
}

func TestSpriteImageSemNome(t *testing.T) {
	req := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/sprite/image", nil)
	rec := httptest.NewRecorder()

	servidorDeSprite(&pokedexFalsa{}).ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, esperado 400", rec.Code)
	}
}

func TestSpriteImageErrosViramStatusAdequado(t *testing.T) {
	casos := map[string]struct {
		erro     error
		esperado int
	}{
		"pokémon inexistente": {erro: pokeapi.ErrNotFound, esperado: http.StatusNotFound},
		"nome inválido":       {erro: pokeapi.ErrInvalidName, esperado: http.StatusNotFound},
		"sem sprite":          {erro: pokeapi.ErrNoSprite, esperado: http.StatusNotFound},
		"falha inesperada":    {erro: context.DeadlineExceeded, esperado: http.StatusInternalServerError},
	}

	for nome, caso := range casos {
		t.Run(nome, func(t *testing.T) {
			req := httptest.NewRequestWithContext(t.Context(), http.MethodGet, "/sprite/image?name=pikachu", nil)
			rec := httptest.NewRecorder()

			servidorDeSprite(&pokedexFalsa{erro: caso.erro}).ServeHTTP(rec, req)

			if rec.Code != caso.esperado {
				t.Errorf("status = %d, esperado %d", rec.Code, caso.esperado)
			}
		})
	}
}
