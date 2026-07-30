package pokemon

import (
	"errors"
	"strings"
	"testing"
)

func TestDailyRollNormalizedAceitaOsTresSexos(t *testing.T) {
	for _, genero := range []string{GenderMale, GenderFemale, GenderGenderless} {
		got, err := DailyRoll{PokemonName: "pikachu", Gender: genero}.normalized()
		if err != nil {
			t.Errorf("sexo %q: erro inesperado: %v", genero, err)
		}
		if got.Gender != genero {
			t.Errorf("sexo = %q, esperado %q", got.Gender, genero)
		}
	}
}

func TestDailyRollNormalizedRejeitaSexoInvalido(t *testing.T) {
	for _, genero := range []string{"", "macho", "MALE", "outro"} {
		_, err := DailyRoll{PokemonName: "pikachu", Gender: genero}.normalized()
		if !errors.Is(err, ErrInvalidGender) {
			t.Errorf("sexo %q: erro = %v, esperado ErrInvalidGender", genero, err)
		}
	}
}

func TestDailyRollNormalizedRejeitaNomeVazio(t *testing.T) {
	for _, nome := range []string{"", "   ", "\t\n"} {
		_, err := DailyRoll{PokemonName: nome, Gender: GenderMale}.normalized()
		if !errors.Is(err, ErrInvalidName) {
			t.Errorf("nome %q: erro = %v, esperado ErrInvalidName", nome, err)
		}
	}
}

func TestDailyRollNormalizedColapsaEspacos(t *testing.T) {
	got, err := DailyRoll{PokemonName: "  mr   mime  ", Gender: GenderMale}.normalized()
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}
	if got.PokemonName != "mr mime" {
		t.Errorf("nome = %q, esperado %q", got.PokemonName, "mr mime")
	}
}

func TestDailyRollNormalizedRejeitaFormaLonga(t *testing.T) {
	_, err := DailyRoll{
		PokemonName: "pikachu",
		Gender:      GenderMale,
		Form:        strings.Repeat("a", maxFormLength+1),
	}.normalized()

	if !errors.Is(err, ErrInvalidForm) {
		t.Errorf("erro = %v, esperado ErrInvalidForm", err)
	}
}

func TestDailyRollNormalizedPreservaShiny(t *testing.T) {
	got, err := DailyRoll{PokemonName: "pikachu", Gender: GenderMale, IsShiny: true}.normalized()
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}
	if !got.IsShiny {
		t.Error("shiny deveria ter sido preservado")
	}
}

func TestDailyRollRequestMapeiaOsCampos(t *testing.T) {
	body := dailyRollRequest{Species: "charizard", Gender: GenderFemale, Shiny: true, Form: "base"}

	got := body.toDailyRoll()

	if got.PokemonName != "charizard" {
		t.Errorf("nome = %q, esperado %q", got.PokemonName, "charizard")
	}
	if got.Gender != GenderFemale {
		t.Errorf("sexo = %q, esperado %q", got.Gender, GenderFemale)
	}
	if !got.IsShiny {
		t.Error("shiny = false, esperado true")
	}
	if got.Form != "base" {
		t.Errorf("forma = %q, esperado %q", got.Form, "base")
	}
}
