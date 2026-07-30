package main

import (
	"fmt"
	"io"

	"github.com/JoaoVictorVM/homedex/cli/internal/roll"
)

func runRoll(stdout io.Writer) int {
	return write(stdout, formataResultado(roll.Roll()), 0)
}

func formataResultado(resultado roll.Result) string {
	return fmt.Sprintf("#%03d %s\nSexo: %s\nShiny: %s\n",
		resultado.Species.Number,
		resultado.Species.DisplayName,
		nomeDoSexo(resultado.Gender),
		nomeDoShiny(resultado.Shiny),
	)
}

func nomeDoSexo(genero roll.Gender) string {
	switch genero {
	case roll.Male:
		return "macho"
	case roll.Female:
		return "fêmea"
	case roll.Genderless:
		return "sem sexo"
	}

	return "sem sexo"
}

func nomeDoShiny(shiny bool) string {
	if shiny {
		return "sim"
	}

	return "não"
}
