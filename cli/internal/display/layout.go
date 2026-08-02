package display

import (
	"fmt"
	"os"
	"strings"

	"golang.org/x/term"

	"github.com/JoaoVictorVM/homedex/cli/internal/roll"
)

const (
	LarguraMinimaDuasColunas = 100
	LarguraPadrao            = 80

	ColunasMaximasDaArte = 80
	colunasMinimasDaArte = 24

	espacamento = 3
	formaPadrao = "padrão"
)

func LarguraDoTerminal() int {
	largura, _, err := term.GetSize(int(os.Stdout.Fd()))
	if err != nil || largura <= 0 {
		return LarguraPadrao
	}

	return largura
}

func ColunasDaArte(resultado roll.Result, largura int) int {
	if largura < LarguraMinimaDuasColunas {
		return limita(largura, colunasMinimasDaArte, ColunasMaximasDaArte)
	}

	return limita(largura-larguraDoPainel(resultado)-espacamento, colunasMinimasDaArte, ColunasMaximasDaArte)
}

func Render(resultado roll.Result, arte string, largura int) string {
	painel := Painel(resultado)

	if arte == "" || largura < LarguraMinimaDuasColunas {
		return empilhado(arte, painel)
	}

	return duasColunas(arte, painel)
}

func Painel(resultado roll.Result) []string {
	return []string{
		fmt.Sprintf("#%03d %s", resultado.Species.Number, resultado.Species.DisplayName),
		"",
		"Forma: " + formaPadrao,
		"Sexo:  " + NomeDoSexo(resultado.Gender),
		"Shiny: " + nomeDoShiny(resultado.Shiny),
	}
}

func NomeDoSexo(genero roll.Gender) string {
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
		return "✨ sim"
	}

	return "não"
}

func empilhado(arte string, painel []string) string {
	var out strings.Builder

	if arte != "" {
		out.WriteString(arte)
		if !strings.HasSuffix(arte, "\n") {
			out.WriteByte('\n')
		}
		out.WriteByte('\n')
	}

	for _, linha := range painel {
		out.WriteString(linha)
		out.WriteByte('\n')
	}

	return out.String()
}

func duasColunas(arte string, painel []string) string {
	linhasDaArte := linhasDe(arte)
	larguraDaArte := maiorLargura(linhasDaArte)

	total := max(len(linhasDaArte), len(painel))

	var out strings.Builder
	for i := 0; i < total; i++ {
		esquerda := ""
		if i < len(linhasDaArte) {
			esquerda = linhasDaArte[i]
		}

		direita := ""
		if i < len(painel) {
			direita = painel[i]
		}

		if direita == "" {
			out.WriteString(strings.TrimRight(esquerda, " "))
			out.WriteByte('\n')

			continue
		}

		out.WriteString(preenche(esquerda, larguraDaArte))
		out.WriteString(strings.Repeat(" ", espacamento))
		out.WriteString(direita)
		out.WriteByte('\n')
	}

	return out.String()
}

func linhasDe(texto string) []string {
	if texto == "" {
		return nil
	}

	return strings.Split(strings.TrimRight(texto, "\n"), "\n")
}

func larguraDoPainel(resultado roll.Result) int {
	return maiorLargura(Painel(resultado))
}

func maiorLargura(linhas []string) int {
	maior := 0
	for _, linha := range linhas {
		maior = max(maior, len([]rune(linha)))
	}

	return maior
}

func preenche(texto string, largura int) string {
	faltam := largura - len([]rune(texto))
	if faltam <= 0 {
		return texto
	}

	return texto + strings.Repeat(" ", faltam)
}

func limita(valor int, minimo int, maximo int) int {
	return min(max(valor, minimo), maximo)
}
