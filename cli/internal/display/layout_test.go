package display

import (
	"strings"
	"testing"

	"github.com/JoaoVictorVM/homedex/cli/internal/pokedex"
	"github.com/JoaoVictorVM/homedex/cli/internal/roll"
)

func resultadoDeTeste(shiny bool) roll.Result {
	return roll.Result{
		Species: pokedex.Species{Number: 25, Name: "pikachu", DisplayName: "Pikachu"},
		Gender:  roll.Male,
		Shiny:   shiny,
	}
}

func arteDeTeste(largura int, linhas int) string {
	var out strings.Builder
	for i := 0; i < linhas; i++ {
		out.WriteString(strings.Repeat("#", largura))
		out.WriteByte('\n')
	}

	return out.String()
}

func TestRenderUsaDuasColunasA100OuMais(t *testing.T) {
	for _, largura := range []int{100, 120, 200} {
		saida := Render(resultadoDeTeste(false), arteDeTeste(40, 5), largura)

		primeira := strings.Split(saida, "\n")[0]
		if !strings.Contains(primeira, "#") || !strings.Contains(primeira, "Pikachu") {
			t.Errorf("largura %d: arte e painel deveriam dividir a mesma linha, veio %q", largura, primeira)
		}
	}
}

func TestRenderEmpilhaAbaixoDe100(t *testing.T) {
	for _, largura := range []int{99, 80, 40} {
		saida := Render(resultadoDeTeste(false), arteDeTeste(40, 5), largura)

		primeira := strings.Split(saida, "\n")[0]
		if strings.Contains(primeira, "Pikachu") {
			t.Errorf("largura %d: painel não deveria estar na primeira linha, veio %q", largura, primeira)
		}
		if !strings.Contains(saida, "Pikachu") {
			t.Errorf("largura %d: painel sumiu da saída", largura)
		}
	}
}

func TestRenderMostraEspecieSexoEShiny(t *testing.T) {
	saida := Render(resultadoDeTeste(false), arteDeTeste(20, 3), LarguraPadrao)

	for _, esperado := range []string{"#025", "Pikachu", "Sexo:", "macho", "Shiny:", "não", "Forma:"} {
		if !strings.Contains(saida, esperado) {
			t.Errorf("saída não traz %q: %q", esperado, saida)
		}
	}
}

func TestRenderRotulaShinyExplicitamente(t *testing.T) {
	shiny := Render(resultadoDeTeste(true), arteDeTeste(20, 3), LarguraPadrao)
	normal := Render(resultadoDeTeste(false), arteDeTeste(20, 3), LarguraPadrao)

	if !strings.Contains(shiny, "✨") {
		t.Errorf("resultado shiny sem rótulo visível: %q", shiny)
	}
	if strings.Contains(normal, "✨") {
		t.Errorf("resultado normal não deveria ter rótulo de shiny: %q", normal)
	}
}

func TestRenderEmbuteAArteRecebida(t *testing.T) {
	arte := "@@@@\n####\n"

	for _, largura := range []int{80, 120} {
		saida := Render(resultadoDeTeste(false), arte, largura)

		for _, linha := range strings.Split(strings.TrimRight(arte, "\n"), "\n") {
			if !strings.Contains(saida, linha) {
				t.Errorf("largura %d: linha de arte %q sumiu da saída", largura, linha)
			}
		}
	}
}

func TestRenderSemArteMostraSoOPainel(t *testing.T) {
	saida := Render(resultadoDeTeste(false), "", 120)

	if !strings.HasPrefix(saida, "#025 Pikachu") {
		t.Errorf("sem arte a saída deveria começar pelo painel, veio %q", saida)
	}
}

func TestRenderNaoEstouraALarguraDoTerminal(t *testing.T) {
	resultado := resultadoDeTeste(true)

	for _, largura := range []int{100, 110, 130} {
		arte := arteDeTeste(ColunasDaArte(resultado, largura), 6)

		for i, linha := range strings.Split(strings.TrimRight(Render(resultado, arte, largura), "\n"), "\n") {
			if got := len([]rune(linha)); got > largura {
				t.Errorf("largura %d: linha %d tem %d colunas", largura, i, got)
			}
		}
	}
}

func TestColunasDaArteRespeitaOTetoDe80(t *testing.T) {
	resultado := resultadoDeTeste(false)

	for _, largura := range []int{80, 100, 200, 500} {
		if got := ColunasDaArte(resultado, largura); got > ColunasMaximasDaArte {
			t.Errorf("largura %d: colunas da arte = %d, máximo %d", largura, got, ColunasMaximasDaArte)
		}
	}
}

func TestColunasDaArteDeixaEspacoParaOPainelEmDuasColunas(t *testing.T) {
	resultado := resultadoDeTeste(true)

	for _, largura := range []int{100, 110} {
		colunas := ColunasDaArte(resultado, largura)

		if colunas+larguraDoPainel(resultado)+espacamento > largura {
			t.Errorf("largura %d: arte (%d) + painel (%d) + espaçamento não cabe", largura, colunas, larguraDoPainel(resultado))
		}
	}
}

func TestColunasDaArteNuncaFicaNegativa(t *testing.T) {
	resultado := resultadoDeTeste(false)

	for _, largura := range []int{0, 1, 10, -5} {
		if got := ColunasDaArte(resultado, largura); got < 1 {
			t.Errorf("largura %d: colunas da arte = %d, deveria ser positiva", largura, got)
		}
	}
}

func TestPainelTemUmaLinhaPorInformacao(t *testing.T) {
	painel := Painel(resultadoDeTeste(false))

	if len(painel) == 0 {
		t.Fatal("painel vazio")
	}
	for i, linha := range painel {
		if strings.Contains(linha, "\n") {
			t.Errorf("linha %d do painel contém quebra: %q", i, linha)
		}
	}
}

func TestNomeDoSexo(t *testing.T) {
	casos := map[roll.Gender]string{
		roll.Male:       "macho",
		roll.Female:     "fêmea",
		roll.Genderless: "sem sexo",
	}

	for genero, esperado := range casos {
		if got := NomeDoSexo(genero); got != esperado {
			t.Errorf("NomeDoSexo(%q) = %q, esperado %q", genero, got, esperado)
		}
	}
}
