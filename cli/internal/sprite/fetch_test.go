package sprite

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/JoaoVictorVM/homedex/cli/internal/config"
)

func servidorDeSprite(t *testing.T, handler http.HandlerFunc) *httptest.Server {
	t.Helper()

	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	t.Setenv(config.APIURLEnvVar, server.URL)

	return server
}

func TestFetchPedeAVarianteShiny(t *testing.T) {
	casos := map[string]struct {
		shiny    bool
		esperado string
	}{
		"shiny":  {shiny: true, esperado: "true"},
		"normal": {shiny: false, esperado: "false"},
	}

	for nome, caso := range casos {
		t.Run(nome, func(t *testing.T) {
			var recebido string

			servidorDeSprite(t, func(w http.ResponseWriter, r *http.Request) {
				recebido = r.URL.Query().Get("shiny")
				if _, err := w.Write([]byte("png")); err != nil {
					t.Errorf("escrever resposta: %v", err)
				}
			})

			if _, err := Fetch(context.Background(), "pikachu", caso.shiny); err != nil {
				t.Fatalf("erro inesperado: %v", err)
			}
			if recebido != caso.esperado {
				t.Errorf("shiny = %q, esperado %q", recebido, caso.esperado)
			}
		})
	}
}

func TestFetchUsaAURLBaseResolvidaPelaConfig(t *testing.T) {
	var caminho string
	var nome string

	server := servidorDeSprite(t, func(w http.ResponseWriter, r *http.Request) {
		caminho = r.URL.Path
		nome = r.URL.Query().Get("name")
		if _, err := w.Write([]byte("png")); err != nil {
			t.Errorf("escrever resposta: %v", err)
		}
	})

	if config.Resolve() != server.URL {
		t.Fatalf("config.Resolve() = %q, esperado %q", config.Resolve(), server.URL)
	}

	if _, err := Fetch(context.Background(), "nidoran-f", false); err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}
	if caminho != spritePath {
		t.Errorf("caminho = %q, esperado %q", caminho, spritePath)
	}
	if nome != "nidoran-f" {
		t.Errorf("name = %q, esperado %q", nome, "nidoran-f")
	}
}

func TestFetchRetornaOsBytesDoCorpo(t *testing.T) {
	servidorDeSprite(t, func(w http.ResponseWriter, _ *http.Request) {
		if _, err := w.Write([]byte("bytes-da-sprite")); err != nil {
			t.Errorf("escrever resposta: %v", err)
		}
	})

	got, err := Fetch(context.Background(), "pikachu", false)
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}
	if string(got) != "bytes-da-sprite" {
		t.Errorf("corpo = %q, esperado %q", got, "bytes-da-sprite")
	}
}

func TestFetchStatusDeErroViraFalha(t *testing.T) {
	servidorDeSprite(t, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	})

	if _, err := Fetch(context.Background(), "pikachu", false); !errors.Is(err, ErrSpriteIndisponivel) {
		t.Errorf("erro = %v, esperado ErrSpriteIndisponivel", err)
	}
}

func TestFetchCorpoVazioViraFalha(t *testing.T) {
	servidorDeSprite(t, func(http.ResponseWriter, *http.Request) {})

	if _, err := Fetch(context.Background(), "pikachu", false); !errors.Is(err, ErrSpriteIndisponivel) {
		t.Errorf("erro = %v, esperado ErrSpriteIndisponivel", err)
	}
}

func TestFetchDesisteNoTimeout(t *testing.T) {
	liberado := make(chan struct{})

	servidorDeSprite(t, func(w http.ResponseWriter, r *http.Request) {
		select {
		case <-liberado:
		case <-r.Context().Done():
		}
	})
	t.Cleanup(func() { close(liberado) })

	inicio := time.Now()

	_, err := Fetch(context.Background(), "pikachu", false)

	decorrido := time.Since(inicio)

	if err == nil {
		t.Fatal("esperado erro por timeout")
	}
	if decorrido > RequestTimeout+2*time.Second {
		t.Errorf("Fetch levou %s, deveria desistir perto de %s", decorrido, RequestTimeout)
	}
}

func TestFetchRespeitaCancelamentoDoContexto(t *testing.T) {
	liberado := make(chan struct{})

	servidorDeSprite(t, func(w http.ResponseWriter, r *http.Request) {
		select {
		case <-liberado:
		case <-r.Context().Done():
		}
	})
	t.Cleanup(func() { close(liberado) })

	ctx, cancel := context.WithCancel(context.Background())
	go func() {
		time.Sleep(50 * time.Millisecond)
		cancel()
	}()

	if _, err := Fetch(ctx, "pikachu", false); err == nil {
		t.Error("esperado erro após cancelamento do contexto")
	}
}
