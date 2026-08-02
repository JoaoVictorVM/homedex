package main

import (
	"bufio"
	"context"
	"io"
	"os"
	"strings"

	"github.com/JoaoVictorVM/homedex/cli/internal/collection"
	"github.com/JoaoVictorVM/homedex/cli/internal/display"
	"github.com/JoaoVictorVM/homedex/cli/internal/roll"
	"github.com/JoaoVictorVM/homedex/cli/internal/sprite"
)

const (
	mensagemCarregando = "Carregando a arte..."
	mensagemSemArte    = "Não foi possível carregar a arte, mostrando só os detalhes."

	perguntaDeAdicao   = "Adicionar este Pokémon à sua coleção? (s/n) "
	mensagemResposta   = "Responda com s (sim) ou n (não)."
	mensagemDescartado = "Tudo bem, nada foi adicionado."
)

type buscadorDeSprite func(ctx context.Context, species string, shiny bool) ([]byte, error)

type fluxoDeAdicao func(leitor *bufio.Scanner, stdout io.Writer, resultado roll.Result) int

func runRoll(stdin io.Reader, stdout io.Writer) int {
	return executaRoll(stdin, stdout, sprite.Fetch, collection.Redeem)
}

func executaRoll(stdin io.Reader, stdout io.Writer, buscar buscadorDeSprite, adicionar fluxoDeAdicao) int {
	leitor := bufio.NewScanner(stdin)
	resultado := roll.Roll()
	largura := display.LarguraDoTerminal()

	interativo := ehTerminal(stdout)
	if interativo {
		if code := write(stdout, mensagemCarregando, 0); code != 0 {
			return code
		}
	}

	arte, aviso := arteDaSprite(context.Background(), buscar, resultado, largura)

	if interativo {
		if code := write(stdout, apagaLinha(mensagemCarregando), 0); code != 0 {
			return code
		}
	}

	if code := write(stdout, display.Render(resultado, arte, largura), 0); code != 0 {
		return code
	}
	if aviso != "" {
		if code := write(stdout, "\n"+aviso+"\n", 0); code != 0 {
			return code
		}
	}

	if !perguntaSeAdiciona(leitor, stdout) {
		return write(stdout, mensagemDescartado+"\n", 0)
	}

	return adicionar(leitor, stdout, resultado)
}

func arteDaSprite(ctx context.Context, buscar buscadorDeSprite, resultado roll.Result, largura int) (string, string) {
	imagem, err := buscar(ctx, resultado.Species.Name, resultado.Shiny)
	if err != nil {
		return "", mensagemSemArte
	}

	arte, err := sprite.Convert(imagem, display.ColunasDaArte(resultado, largura))
	if err != nil {
		return "", mensagemSemArte
	}

	return arte, ""
}

func perguntaSeAdiciona(leitor *bufio.Scanner, stdout io.Writer) bool {
	for {
		if code := write(stdout, "\n"+perguntaDeAdicao, 0); code != 0 {
			return false
		}

		if !leitor.Scan() {
			if code := write(stdout, "\n", 0); code != 0 {
				return false
			}

			return false
		}

		switch strings.ToLower(strings.TrimSpace(leitor.Text())) {
		case "s", "sim", "y", "yes":
			return true
		case "n", "nao", "não", "no":
			return false
		}

		if code := write(stdout, mensagemResposta+"\n", 0); code != 0 {
			return false
		}
	}
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

func apagaLinha(texto string) string {
	return "\r" + strings.Repeat(" ", len([]rune(texto))) + "\r"
}
