package games

import (
	"errors"
	"strings"
	"testing"
)

func TestParseNameValido(t *testing.T) {
	tests := map[string]struct {
		input string
		want  string
	}{
		"simples":            {input: "Radical Red", want: "Radical Red"},
		"com espaços extras": {input: "  Radical   Red  ", want: "Radical Red"},
		"com acentos":        {input: "Pokémon Vermelho", want: "Pokémon Vermelho"},
		"no limite":          {input: strings.Repeat("a", maxNameLength), want: strings.Repeat("a", maxNameLength)},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			got, err := ParseName(tt.input)
			if err != nil {
				t.Fatalf("erro inesperado: %v", err)
			}
			if got != tt.want {
				t.Errorf("ParseName(%q) = %q, esperado %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestParseNameInvalido(t *testing.T) {
	tests := map[string]string{
		"vazio":           "",
		"só espaços":      "   ",
		"acima do limite": strings.Repeat("a", maxNameLength+1),
	}

	for name, input := range tests {
		t.Run(name, func(t *testing.T) {
			if _, err := ParseName(input); !errors.Is(err, ErrInvalidName) {
				t.Errorf("ParseName(%q) erro = %v, esperado ErrInvalidName", input, err)
			}
		})
	}
}
