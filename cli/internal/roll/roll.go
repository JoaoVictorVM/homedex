package roll

import (
	"math/rand/v2"

	"github.com/JoaoVictorVM/homedex/cli/internal/pokedex"
)

const ShinyOdds = 20

type Gender string

const (
	Male       Gender = "male"
	Female     Gender = "female"
	Genderless Gender = "genderless"
)

type Source interface {
	IntN(n int) int
}

type Result struct {
	Species pokedex.Species
	Gender  Gender
	Shiny   bool
}

type globalSource struct{}

func (globalSource) IntN(n int) int {
	return rand.IntN(n)
}

func Roll() Result {
	return RollWith(globalSource{})
}

func RollWith(src Source) Result {
	species := pokedex.At(src.IntN(pokedex.Len()))

	return Result{
		Species: species,
		Gender:  rollGender(species.Gender, src),
		Shiny:   src.IntN(ShinyOdds) == 0,
	}
}

func rollGender(kind pokedex.GenderKind, src Source) Gender {
	switch kind {
	case pokedex.Genderless:
		return Genderless
	case pokedex.MaleOnly:
		return Male
	case pokedex.FemaleOnly:
		return Female
	case pokedex.Both:
		if src.IntN(2) == 0 {
			return Male
		}

		return Female
	}

	return Genderless
}
