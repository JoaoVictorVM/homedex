package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/JoaoVictorVM/homedex/cli/internal/roll"
	"github.com/JoaoVictorVM/homedex/cli/internal/sprite"
)

const (
	mensagemCarregando = "Carregando a arte..."
	mensagemSemArte    = "Não foi possível carregar a arte, mostrando só os detalhes."
)

type buscadorDeSprite func(ctx context.Context, species string, shiny bool) ([]byte, error)

func runRoll(stdout io.Writer) int {
	return executaRoll(stdout, sprite.Fetch)
}

func executaRoll(stdout io.Writer, buscar buscadorDeSprite) int {
	resultado := roll.Roll()

	if code := write(stdout, formataResultado(resultado), 0); code != 0 {
		return code
	}

	interativo := ehTerminal(stdout)

	if interativo {
		if code := write(stdout, mensagemCarregando, 0); code != 0 {
			return code
		}
	}

	arte := arteDaSprite(context.Background(), buscar, resultado)

	if interativo {
		if code := write(stdout, apagaLinha(mensagemCarregando), 0); code != 0 {
			return code
		}
	}

	return write(stdout, arte, 0)
}

func ehTerminal(w io.Writer) bool {
	arquivo, ok := w.(*os.File)
	if !ok {
		return false
	}

	info, err := arquivo.Stat()
	if err != nil {
		return false
	}

	return info.Mode()&os.ModeCharDevice != 0
}

func arteDaSprite(ctx context.Context, buscar buscadorDeSprite, resultado roll.Result) string {
	imagem, err := buscar(ctx, resultado.Species.Name, resultado.Shiny)
	if err != nil {
		return mensagemSemArte + "\n"
	}

	arte, err := sprite.Convert(imagem, sprite.DefaultColumns)
	if err != nil {
		return mensagemSemArte + "\n"
	}

	return arte
}

func apagaLinha(texto string) string {
	return "\r" + strings.Repeat(" ", len(texto)) + "\r"
}

func formataResultado(resultado roll.Result) string {
	return fmt.Sprintf("#%03d %s\nSexo: %s\nShiny: %s\n\n",
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
