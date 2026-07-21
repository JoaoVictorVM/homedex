package pokemon

import (
	"errors"
	"strings"
	"unicode/utf8"
)

const (
	GenderMale       = "male"
	GenderFemale     = "female"
	GenderGenderless = "genderless"

	SlotsPerBox = 30
	MaxBoxes    = 32

	maxNicknameLength = 30
	maxFormLength     = 60
)

var (
	ErrInvalidGender   = errors.New("sexo inválido")
	ErrInvalidPosition = errors.New("posição inválida")
	ErrInvalidName     = errors.New("nome do pokémon é obrigatório")
	ErrInvalidNickname = errors.New("apelido inválido")
	ErrInvalidForm     = errors.New("forma inválida")
	ErrInvalidGame     = errors.New("jogo é obrigatório")
	ErrSlotTaken       = errors.New("slot já ocupado")
	ErrGameNotFound    = errors.New("jogo não encontrado na coleção")
	ErrNotFound        = errors.New("pokémon não encontrado na coleção")
)

type Pokemon struct {
	ID          int64  `json:"id"`
	PokemonName string `json:"pokemonName"`
	Nickname    string `json:"nickname"`
	IsShiny     bool   `json:"isShiny"`
	Gender      string `json:"gender"`
	Form        string `json:"form"`
	GameID      int64  `json:"gameId"`
	BoxNumber   int    `json:"boxNumber"`
	Slot        int    `json:"slot"`
	Sprite      string `json:"sprite"`
}

type EditPokemon struct {
	PokemonName string
	Nickname    string
	IsShiny     bool
	Gender      string
	Form        string
	GameID      int64
}

type NewPokemon struct {
	EditPokemon
	BoxNumber int
	Slot      int
}

func (e EditPokemon) normalized() (EditPokemon, error) {
	e.PokemonName = collapseSpaces(e.PokemonName)
	if e.PokemonName == "" {
		return EditPokemon{}, ErrInvalidName
	}

	e.Nickname = collapseSpaces(e.Nickname)
	if utf8.RuneCountInString(e.Nickname) > maxNicknameLength {
		return EditPokemon{}, ErrInvalidNickname
	}

	e.Form = collapseSpaces(e.Form)
	if utf8.RuneCountInString(e.Form) > maxFormLength {
		return EditPokemon{}, ErrInvalidForm
	}

	if !validGender(e.Gender) {
		return EditPokemon{}, ErrInvalidGender
	}

	if e.GameID <= 0 {
		return EditPokemon{}, ErrInvalidGame
	}

	return e, nil
}

func collapseSpaces(raw string) string {
	return strings.Join(strings.Fields(raw), " ")
}

func validGender(gender string) bool {
	switch gender {
	case GenderMale, GenderFemale, GenderGenderless:
		return true
	default:
		return false
	}
}
