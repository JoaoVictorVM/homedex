package collection

import (
	"strings"
	"testing"
)

func TestNewCode(t *testing.T) {
	code, err := NewCode()
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	if len(code) != CodeLength {
		t.Errorf("tamanho do código = %d, esperado %d", len(code), CodeLength)
	}

	for _, r := range code {
		if !strings.ContainsRune(codeAlphabet, r) {
			t.Errorf("código %q contém caractere fora do alfabeto: %q", code, r)
		}
	}
}

func TestNewCodeSemCaracteresAmbiguos(t *testing.T) {
	for _, ambiguous := range "0O1lI" {
		if strings.ContainsRune(codeAlphabet, ambiguous) {
			t.Errorf("alfabeto contém caractere ambíguo %q", ambiguous)
		}
	}
}

func TestNewCodeGeraCodigosDistintos(t *testing.T) {
	const sample = 10000

	seen := make(map[string]struct{}, sample)
	for range sample {
		code, err := NewCode()
		if err != nil {
			t.Fatalf("erro inesperado: %v", err)
		}
		if _, duplicated := seen[code]; duplicated {
			t.Fatalf("código duplicado gerado: %q", code)
		}
		seen[code] = struct{}{}
	}
}
