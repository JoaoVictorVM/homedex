package pokemon

import "errors"

const (
	GenderMale       = "male"
	GenderFemale     = "female"
	GenderGenderless = "genderless"

	SlotsPerBox = 30
	MaxBoxes    = 32
)

var (
	ErrInvalidGender   = errors.New("sexo inválido")
	ErrInvalidPosition = errors.New("posição inválida")
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

type NewPokemon struct {
	PokemonName string
	Nickname    string
	IsShiny     bool
	Gender      string
	Form        string
	GameID      int64
	BoxNumber   int
	Slot        int
}

func validGender(gender string) bool {
	switch gender {
	case GenderMale, GenderFemale, GenderGenderless:
		return true
	default:
		return false
	}
}
