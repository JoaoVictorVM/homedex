package config_test

import (
	"testing"

	"github.com/JoaoVictorVM/homedex/cli/internal/config"
)

func TestResolve_UsesEnvVarWhenSet(t *testing.T) {
	t.Setenv(config.APIURLEnvVar, "http://localhost:8080")

	if got := config.Resolve(); got != "http://localhost:8080" {
		t.Fatalf("Resolve() = %q, esperado %q", got, "http://localhost:8080")
	}
}

func TestResolve_FallsBackWhenUnset(t *testing.T) {
	t.Setenv(config.APIURLEnvVar, "")

	if got := config.Resolve(); got != "https://homedex-server.onrender.com" {
		t.Fatalf("Resolve() = %q, esperado a constante de produção", got)
	}
}
