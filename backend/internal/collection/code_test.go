package collection

import (
	"errors"
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

func TestParseCodeValido(t *testing.T) {
	tests := map[string]struct {
		input string
		want  string
	}{
		"já normalizado":  {input: "A7K9F2QX", want: "A7K9F2QX"},
		"com separador":   {input: "A7K9-F2QX", want: "A7K9F2QX"},
		"minúsculas":      {input: "a7k9f2qx", want: "A7K9F2QX"},
		"com espaços":     {input: "  A7K9F2QX  ", want: "A7K9F2QX"},
		"formato exibido": {input: " a7k9-f2qx ", want: "A7K9F2QX"},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			got, err := ParseCode(tt.input)
			if err != nil {
				t.Fatalf("erro inesperado: %v", err)
			}
			if got != tt.want {
				t.Errorf("ParseCode(%q) = %q, esperado %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestParseCodeInvalido(t *testing.T) {
	tests := map[string]string{
		"vazio":                 "",
		"curto":                 "A7K9F2Q",
		"longo":                 "A7K9F2QXZ",
		"caractere ambíguo":     "A7K9F2Q0",
		"caractere inexistente": "A7K9F2Q@",
		"só separadores":        "--------",
	}

	for name, input := range tests {
		t.Run(name, func(t *testing.T) {
			if _, err := ParseCode(input); !errors.Is(err, ErrInvalidCode) {
				t.Errorf("ParseCode(%q) erro = %v, esperado ErrInvalidCode", input, err)
			}
		})
	}
}

func TestParseCodeAceitaCodigoGerado(t *testing.T) {
	code, err := NewCode()
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	parsed, err := ParseCode(code)
	if err != nil {
		t.Fatalf("ParseCode rejeitou código gerado %q: %v", code, err)
	}
	if parsed != code {
		t.Errorf("ParseCode(%q) = %q, esperado inalterado", code, parsed)
	}
}
