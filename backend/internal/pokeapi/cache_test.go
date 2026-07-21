package pokeapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
)

func TestPokemonUsaCache(t *testing.T) {
	var requests atomic.Int64

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		requests.Add(1)
		if _, err := w.Write([]byte(bulbasaurBody)); err != nil {
			t.Errorf("escrever resposta: %v", err)
		}
	}))
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	for range 5 {
		if _, err := client.Pokemon(context.Background(), "Bulbasaur"); err != nil {
			t.Fatalf("erro inesperado: %v", err)
		}
	}

	if got := requests.Load(); got != 1 {
		t.Errorf("requisições = %d, esperado 1", got)
	}
}

func TestCacheNaoGuardaErro(t *testing.T) {
	var requests atomic.Int64

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		requests.Add(1)
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	for range 2 {
		if _, err := client.Pokemon(context.Background(), "missingno"); err == nil {
			t.Fatal("esperado erro")
		}
	}

	if got := requests.Load(); got < 2 {
		t.Errorf("requisições = %d, esperado nova tentativa após erro", got)
	}
}

func TestCacheConcorrente(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		if _, err := w.Write([]byte(bulbasaurBody)); err != nil {
			t.Errorf("escrever resposta: %v", err)
		}
	}))
	defer server.Close()

	client := New(Options{BaseURL: server.URL})

	var wg sync.WaitGroup
	for range 50 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if _, err := client.Pokemon(context.Background(), "bulbasaur"); err != nil {
				t.Errorf("erro inesperado: %v", err)
			}
		}()
	}
	wg.Wait()
}

func TestCacheRespeitaLimite(t *testing.T) {
	c := newCache[int](2)

	c.set("a", 1)
	c.set("b", 2)
	c.set("c", 3)

	if _, ok := c.get("a"); ok {
		t.Error("entrada antiga deveria ter sido descartada ao atingir o limite")
	}
	if got, ok := c.get("c"); !ok || got != 3 {
		t.Errorf("entrada nova = %v, ok = %v", got, ok)
	}
}
