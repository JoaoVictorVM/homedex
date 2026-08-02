package collection

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/JoaoVictorVM/homedex/cli/internal/config"
	"github.com/JoaoVictorVM/homedex/cli/internal/pokedex"
	"github.com/JoaoVictorVM/homedex/cli/internal/roll"
)

func servidorDeResgate(t *testing.T, handler http.HandlerFunc) *httptest.Server {
	t.Helper()

	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	t.Setenv(config.APIURLEnvVar, server.URL)

	return server
}

func resultadoDeTeste() roll.Result {
	return roll.Result{
		Species: pokedex.Species{Number: 25, Name: "pikachu", DisplayName: "Pikachu"},
		Gender:  roll.Female,
		Shiny:   true,
	}
}

func respondeCriado(t *testing.T, w http.ResponseWriter, box int, slot int) {
	t.Helper()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(map[string]any{
		"id": 1, "pokemonName": "pikachu", "boxNumber": box, "slot": slot,
	}); err != nil {
		t.Errorf("escrever resposta: %v", err)
	}
}

func TestResgatarDevolveBoxESlotDaResposta(t *testing.T) {
	servidorDeResgate(t, func(w http.ResponseWriter, _ *http.Request) {
		respondeCriado(t, w, 2, 7)
	})

	resgate, err := Resgatar(context.Background(), "A7K9F2QX", resultadoDeTeste())
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}
	if resgate.BoxNumber != 2 {
		t.Errorf("box = %d, esperado 2", resgate.BoxNumber)
	}
	if resgate.Slot != 7 {
		t.Errorf("slot = %d, esperado 7", resgate.Slot)
	}
}

func TestResgatarUsaAURLBaseResolvidaPelaConfig(t *testing.T) {
	var caminho string
	var metodo string

	server := servidorDeResgate(t, func(w http.ResponseWriter, r *http.Request) {
		caminho = r.URL.Path
		metodo = r.Method
		respondeCriado(t, w, 1, 0)
	})

	if config.Resolve() != server.URL {
		t.Fatalf("config.Resolve() = %q, esperado %q", config.Resolve(), server.URL)
	}

	if _, err := Resgatar(context.Background(), "A7K9F2QX", resultadoDeTeste()); err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}
	if metodo != http.MethodPost {
		t.Errorf("método = %q, esperado POST", metodo)
	}
	if caminho != "/collections/A7K9F2QX/daily-roll" {
		t.Errorf("caminho = %q, esperado /collections/A7K9F2QX/daily-roll", caminho)
	}
}

func TestResgatarEnviaOsAtributosDoRollSemJogo(t *testing.T) {
	var corpo map[string]any

	servidorDeResgate(t, func(w http.ResponseWriter, r *http.Request) {
		if err := json.NewDecoder(r.Body).Decode(&corpo); err != nil {
			t.Errorf("decodificar corpo: %v", err)
		}
		respondeCriado(t, w, 1, 0)
	})

	if _, err := Resgatar(context.Background(), "A7K9F2QX", resultadoDeTeste()); err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	if corpo["species"] != "pikachu" {
		t.Errorf("species = %v, esperado pikachu", corpo["species"])
	}
	if corpo["gender"] != "female" {
		t.Errorf("gender = %v, esperado female", corpo["gender"])
	}
	if corpo["shiny"] != true {
		t.Errorf("shiny = %v, esperado true", corpo["shiny"])
	}
	for _, proibido := range []string{"game", "gameId", "game_id"} {
		if _, tem := corpo[proibido]; tem {
			t.Errorf("corpo não deveria trazer %q: %v", proibido, corpo)
		}
	}
}

func TestResgatarMapeiaOsStatusDeErro(t *testing.T) {
	casos := map[string]struct {
		status   int
		esperado error
	}{
		"código inválido":     {status: http.StatusBadRequest, esperado: ErrCodigoInvalido},
		"código inexistente":  {status: http.StatusNotFound, esperado: ErrCodigoNaoEncontrado},
		"coleção cheia":       {status: http.StatusUnprocessableEntity, esperado: ErrColecaoCheia},
		"falha no servidor":   {status: http.StatusInternalServerError, esperado: ErrResgateIndisponivel},
		"resposta inesperada": {status: http.StatusTeapot, esperado: ErrResgateIndisponivel},
	}

	for nome, caso := range casos {
		t.Run(nome, func(t *testing.T) {
			servidorDeResgate(t, func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(caso.status)
				if _, err := w.Write([]byte(`{"error":"falhou"}`)); err != nil {
					t.Errorf("escrever resposta: %v", err)
				}
			})

			_, err := Resgatar(context.Background(), "A7K9F2QX", resultadoDeTeste())
			if !errors.Is(err, caso.esperado) {
				t.Errorf("erro = %v, esperado %v", err, caso.esperado)
			}
		})
	}
}

func TestResgatarDevolveOProximoResgateNoConflito(t *testing.T) {
	servidorDeResgate(t, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusConflict)
		if _, err := w.Write([]byte(
			`{"error":"já resgatado","nextAvailableAt":"2026-08-02T00:00:00Z"}`,
		)); err != nil {
			t.Errorf("escrever resposta: %v", err)
		}
	})

	_, err := Resgatar(context.Background(), "A7K9F2QX", resultadoDeTeste())

	var jaResgatado *JaResgatadoError
	if !errors.As(err, &jaResgatado) {
		t.Fatalf("erro = %v, esperado JaResgatadoError", err)
	}

	esperado := time.Date(2026, time.August, 2, 0, 0, 0, 0, time.UTC)
	if !jaResgatado.ProximoResgate.Equal(esperado) {
		t.Errorf("próximo resgate = %s, esperado %s", jaResgatado.ProximoResgate, esperado)
	}
}

func TestResgatarDesisteNoTimeout(t *testing.T) {
	liberado := make(chan struct{})

	servidorDeResgate(t, func(_ http.ResponseWriter, r *http.Request) {
		select {
		case <-liberado:
		case <-r.Context().Done():
		}
	})
	t.Cleanup(func() { close(liberado) })

	inicio := time.Now()

	_, err := Resgatar(context.Background(), "A7K9F2QX", resultadoDeTeste())

	decorrido := time.Since(inicio)

	if err == nil {
		t.Fatal("esperado erro por timeout")
	}
	if decorrido > RequestTimeout+2*time.Second {
		t.Errorf("Resgatar levou %s, deveria desistir perto de %s", decorrido, RequestTimeout)
	}
}

func TestResgatarFalhaQuandoOServidorEstaForaDoAr(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
	t.Setenv(config.APIURLEnvVar, server.URL)
	server.Close()

	if _, err := Resgatar(context.Background(), "A7K9F2QX", resultadoDeTeste()); err == nil {
		t.Error("esperado erro de rede")
	}
}
