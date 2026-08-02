package pokeapi

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
)

func pngDeTeste(t *testing.T) []byte {
	t.Helper()

	img := image.NewRGBA(image.Rect(0, 0, 2, 2))
	img.Set(0, 0, color.White)
	img.Set(1, 1, color.Black)

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("codificar png de teste: %v", err)
	}

	return buf.Bytes()
}

func servidorComImagem(t *testing.T, imagem []byte, downloads *atomic.Int64) *httptest.Server {
	t.Helper()

	server := httptest.NewUnstartedServer(nil)
	base := "http://" + server.Listener.Addr().String()

	server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/img/") {
			if downloads != nil {
				downloads.Add(1)
			}
			if _, err := w.Write(imagem); err != nil {
				t.Errorf("escrever imagem: %v", err)
			}

			return
		}

		name := strings.TrimPrefix(r.URL.Path, "/pokemon/")
		if name != "pikachu" {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		body := fmt.Sprintf(
			`{"id":25,"name":"pikachu","sprites":{"front_default":%q,"front_shiny":%q},"forms":[{"name":"pikachu"}]}`,
			base+"/img/normal.png", base+"/img/shiny.png",
		)
		if _, err := w.Write([]byte(body)); err != nil {
			t.Errorf("escrever resposta: %v", err)
		}
	})
	server.Start()

	return server
}

func TestSpriteImageBaixaOsBytesDaSprite(t *testing.T) {
	imagem := pngDeTeste(t)

	server := servidorComImagem(t, imagem, nil)
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	got, err := client.SpriteImage(context.Background(), "Pikachu", "", false)
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}
	if !bytes.Equal(got, imagem) {
		t.Errorf("bytes retornados diferem da imagem servida (%d vs %d bytes)", len(got), len(imagem))
	}
}

func TestSpriteImageUsaCacheNaSegundaChamada(t *testing.T) {
	var downloads atomic.Int64

	server := servidorComImagem(t, pngDeTeste(t), &downloads)
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	for i := 0; i < 3; i++ {
		if _, err := client.SpriteImage(context.Background(), "Pikachu", "", false); err != nil {
			t.Fatalf("chamada %d: erro inesperado: %v", i, err)
		}
	}

	if got := downloads.Load(); got != 1 {
		t.Errorf("downloads = %d, esperado 1 (as demais deveriam vir do cache)", got)
	}
}

func TestSpriteImageDiferenciaNormalDeShiny(t *testing.T) {
	var downloads atomic.Int64

	server := servidorComImagem(t, pngDeTeste(t), &downloads)
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	if _, err := client.SpriteImage(context.Background(), "Pikachu", "", false); err != nil {
		t.Fatalf("normal: erro inesperado: %v", err)
	}
	if _, err := client.SpriteImage(context.Background(), "Pikachu", "", true); err != nil {
		t.Fatalf("shiny: erro inesperado: %v", err)
	}

	if got := downloads.Load(); got != 2 {
		t.Errorf("downloads = %d, esperado 2 (normal e shiny têm URLs distintas)", got)
	}
}

func TestSpriteImagePokemonInexistente(t *testing.T) {
	server := servidorComImagem(t, pngDeTeste(t), nil)
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	if _, err := client.SpriteImage(context.Background(), "Inexistente", "", false); !errors.Is(err, ErrNotFound) {
		t.Errorf("erro = %v, esperado ErrNotFound", err)
	}
}

func TestSpriteImageRejeitaEsquemaNaoHTTP(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		body := `{"id":25,"name":"pikachu","sprites":{"front_default":"file:///etc/passwd","front_shiny":""},"forms":[{"name":"pikachu"}]}`
		if _, err := w.Write([]byte(body)); err != nil {
			t.Errorf("escrever resposta: %v", err)
		}
	}))
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	if _, err := client.SpriteImage(context.Background(), "Pikachu", "", false); !errors.Is(err, ErrInvalidSpriteURL) {
		t.Errorf("erro = %v, esperado ErrInvalidSpriteURL", err)
	}
}
