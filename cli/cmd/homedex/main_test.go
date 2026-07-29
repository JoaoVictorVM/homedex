package main

import (
	"bytes"
	"strings"
	"testing"

	"github.com/JoaoVictorVM/homedex/cli/internal/config"
)

func TestRunSemArgumentosMostraUso(t *testing.T) {
	var stdout, stderr bytes.Buffer

	if code := run(nil, &stdout, &stderr); code != 0 {
		t.Fatalf("run() = %d, esperado 0", code)
	}
	if !strings.Contains(stdout.String(), "Usage:") {
		t.Errorf("stdout não contém o texto de uso: %q", stdout.String())
	}
	if stderr.Len() != 0 {
		t.Errorf("stderr deveria estar vazio, veio %q", stderr.String())
	}
}

func TestRunConfigImprimeURLResolvida(t *testing.T) {
	t.Setenv(config.APIURLEnvVar, "http://localhost:8080")

	var stdout, stderr bytes.Buffer

	if code := run([]string{"config"}, &stdout, &stderr); code != 0 {
		t.Fatalf("run() = %d, esperado 0", code)
	}
	if got := strings.TrimSpace(stdout.String()); got != "http://localhost:8080" {
		t.Errorf("stdout = %q, esperado %q", got, "http://localhost:8080")
	}
}

func TestRunComandoDesconhecido(t *testing.T) {
	var stdout, stderr bytes.Buffer

	if code := run([]string{"inexistente"}, &stdout, &stderr); code != 2 {
		t.Fatalf("run() = %d, esperado 2", code)
	}
	if !strings.Contains(stderr.String(), "unknown command") {
		t.Errorf("stderr não explica o comando desconhecido: %q", stderr.String())
	}
	if stdout.Len() != 0 {
		t.Errorf("stdout deveria estar vazio, veio %q", stdout.String())
	}
}
