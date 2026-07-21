package pokemon

import (
	"errors"
	"strings"
	"testing"
)

func validEdit() EditPokemon {
	return EditPokemon{
		PokemonName: "bulbasaur",
		Gender:      GenderMale,
		GameID:      1,
	}
}

func TestNormalizedAceitaAtributosValidos(t *testing.T) {
	edit := validEdit()
	edit.PokemonName = "  Mr.   Mime "
	edit.Nickname = "  Meu   Bulba  "
	edit.Form = "  rattata-alola "

	got, err := edit.normalized()
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	if got.PokemonName != "Mr. Mime" {
		t.Errorf("nome = %q", got.PokemonName)
	}
	if got.Nickname != "Meu Bulba" {
		t.Errorf("apelido = %q", got.Nickname)
	}
	if got.Form != "rattata-alola" {
		t.Errorf("forma = %q", got.Form)
	}
}

func TestNormalizedAceitaCamposOpcionaisVazios(t *testing.T) {
	got, err := validEdit().normalized()
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	if got.Nickname != "" || got.Form != "" {
		t.Errorf("campos opcionais = %+v", got)
	}
}

func TestNormalizedRejeitaAtributosInvalidos(t *testing.T) {
	tests := map[string]struct {
		mutate func(*EditPokemon)
		want   error
	}{
		"nome vazio": {
			mutate: func(e *EditPokemon) { e.PokemonName = "   " },
			want:   ErrInvalidName,
		},
		"apelido longo": {
			mutate: func(e *EditPokemon) { e.Nickname = strings.Repeat("a", maxNicknameLength+1) },
			want:   ErrInvalidNickname,
		},
		"forma longa": {
			mutate: func(e *EditPokemon) { e.Form = strings.Repeat("a", maxFormLength+1) },
			want:   ErrInvalidForm,
		},
		"sexo inválido": {
			mutate: func(e *EditPokemon) { e.Gender = "macho" },
			want:   ErrInvalidGender,
		},
		"sexo vazio": {
			mutate: func(e *EditPokemon) { e.Gender = "" },
			want:   ErrInvalidGender,
		},
		"jogo ausente": {
			mutate: func(e *EditPokemon) { e.GameID = 0 },
			want:   ErrInvalidGame,
		},
		"jogo negativo": {
			mutate: func(e *EditPokemon) { e.GameID = -5 },
			want:   ErrInvalidGame,
		},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			edit := validEdit()
			tt.mutate(&edit)

			if _, err := edit.normalized(); !errors.Is(err, tt.want) {
				t.Errorf("erro = %v, esperado %v", err, tt.want)
			}
		})
	}
}

func TestNormalizedAceitaTodosOsSexos(t *testing.T) {
	for _, gender := range []string{GenderMale, GenderFemale, GenderGenderless} {
		t.Run(gender, func(t *testing.T) {
			edit := validEdit()
			edit.Gender = gender

			if _, err := edit.normalized(); err != nil {
				t.Errorf("sexo %q rejeitado: %v", gender, err)
			}
		})
	}
}
