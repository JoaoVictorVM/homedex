package main

import (
	"bytes"
	"context"
	"errors"
	"image"
	"image/color"
	"image/png"
	"io"
	"strings"
	"testing"

	"github.com/JoaoVictorVM/homedex/cli/internal/pokedex"
	"github.com/JoaoVictorVM/homedex/cli/internal/roll"
	"github.com/JoaoVictorVM/homedex/cli/internal/sprite"
)

func pngDeTeste(t *testing.T) []byte {
	t.Helper()

	img := image.NewRGBA(image.Rect(0, 0, 16, 16))
	for y := 0; y < 16; y++ {
		for x := 0; x < 16; x++ {
			img.Set(x, y, color.RGBA{R: uint8(x * 16), G: uint8(y * 16), B: 0, A: 255})
		}
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("codificar png de teste: %v", err)
	}

	return buf.Bytes()
}

func buscaOk(t *testing.T) buscadorDeSprite {
	t.Helper()

	return func(context.Context, string, bool) ([]byte, error) { return pngDeTeste(t), nil }
}

func adicaoNaoChamada(t *testing.T) fluxoDeAdicao {
	t.Helper()

	return func(io.Reader, io.Writer, roll.Result) int {
		t.Error("o fluxo de adição não deveria ter sido chamado")

		return 0
	}
}

func TestExecutaRollMostraEspecieSexoEShiny(t *testing.T) {
	var stdout bytes.Buffer

	if code := executaRoll(strings.NewReader("n\n"), &stdout, buscaOk(t), adicaoNaoChamada(t)); code != 0 {
		t.Fatalf("executaRoll() = %d, esperado 0", code)
	}

	saida := stdout.String()
	for _, esperado := range []string{"Sexo:", "Shiny:", "Forma:"} {
		if !strings.Contains(saida, esperado) {
			t.Errorf("saída não traz %q: %q", esperado, saida)
		}
	}
}

func TestExecutaRollRenderizaAArteQuandoABuscaFunciona(t *testing.T) {
	var stdout bytes.Buffer

	executaRoll(strings.NewReader("n\n"), &stdout, buscaOk(t), adicaoNaoChamada(t))

	saida := stdout.String()
	if strings.Contains(saida, mensagemSemArte) {
		t.Errorf("não deveria ter caído no fallback: %q", saida)
	}

	temRampa := false
	for _, r := range saida {
		if r != ' ' && strings.ContainsRune(sprite.Ramp, r) {
			temRampa = true
			break
		}
	}
	if !temRampa {
		t.Errorf("nenhum caractere de arte na saída: %q", saida)
	}
}

func TestExecutaRollUsaOIdentificadorDaPokeapiEOShinyDoResultado(t *testing.T) {
	var nomePedido string
	var shinyPedido bool
	var chamadas int

	buscar := func(_ context.Context, species string, shiny bool) ([]byte, error) {
		nomePedido = species
		shinyPedido = shiny
		chamadas++

		return pngDeTeste(t), nil
	}

	var stdout bytes.Buffer
	executaRoll(strings.NewReader("n\n"), &stdout, buscar, adicaoNaoChamada(t))

	if chamadas != 1 {
		t.Fatalf("buscas = %d, esperado 1", chamadas)
	}

	encontrado := false
	for _, especie := range pokedex.All() {
		if especie.Name == nomePedido {
			encontrado = true

			if !strings.Contains(stdout.String(), especie.DisplayName) {
				t.Errorf("buscou %q mas exibiu outra espécie: %q", nomePedido, stdout.String())
			}

			break
		}
	}
	if !encontrado {
		t.Errorf("nome pedido %q não é um identificador do dataset", nomePedido)
	}

	if temShiny := strings.Contains(stdout.String(), "✨"); shinyPedido != temShiny {
		t.Errorf("pediu shiny=%v mas exibiu shiny=%v", shinyPedido, temShiny)
	}
}

func TestExecutaRollCaiNoFallbackQuandoABuscaFalha(t *testing.T) {
	var stdout bytes.Buffer

	buscar := func(context.Context, string, bool) ([]byte, error) {
		return nil, errors.New("rede indisponível")
	}

	if code := executaRoll(strings.NewReader("n\n"), &stdout, buscar, adicaoNaoChamada(t)); code != 0 {
		t.Fatalf("executaRoll() = %d, esperado 0 mesmo com falha na sprite", code)
	}

	saida := stdout.String()
	if !strings.Contains(saida, mensagemSemArte) {
		t.Errorf("saída não traz a mensagem de fallback: %q", saida)
	}
	if !strings.Contains(saida, "Sexo:") || !strings.Contains(saida, "Shiny:") {
		t.Errorf("os detalhes deveriam continuar visíveis: %q", saida)
	}
}

func TestExecutaRollCaiNoFallbackQuandoAImagemNaoDecodifica(t *testing.T) {
	var stdout bytes.Buffer

	buscar := func(context.Context, string, bool) ([]byte, error) {
		return []byte("isto não é um png"), nil
	}

	executaRoll(strings.NewReader("n\n"), &stdout, buscar, adicaoNaoChamada(t))

	if !strings.Contains(stdout.String(), mensagemSemArte) {
		t.Errorf("saída não traz a mensagem de fallback: %q", stdout.String())
	}
}

func TestExecutaRollNaoSegueParaAAdicaoQuandoRespondeNao(t *testing.T) {
	respostas := []string{"n\n", "N\n", "nao\n", "não\n", "no\n", "NO\n"}

	for _, resposta := range respostas {
		t.Run(strings.TrimSpace(resposta), func(t *testing.T) {
			var stdout bytes.Buffer

			code := executaRoll(strings.NewReader(resposta), &stdout, buscaOk(t), adicaoNaoChamada(t))

			if code != 0 {
				t.Errorf("executaRoll() = %d, esperado 0", code)
			}
			if !strings.Contains(stdout.String(), mensagemDescartado) {
				t.Errorf("saída não confirma o descarte: %q", stdout.String())
			}
		})
	}
}

func TestExecutaRollSegueParaAAdicaoQuandoRespondeSim(t *testing.T) {
	respostas := []string{"s\n", "S\n", "sim\n", "y\n", "yes\n", "  Sim  \n"}

	for _, resposta := range respostas {
		t.Run(strings.TrimSpace(resposta), func(t *testing.T) {
			var stdout bytes.Buffer
			var chamado bool
			var recebido roll.Result

			adicionar := func(_ io.Reader, _ io.Writer, resultado roll.Result) int {
				chamado = true
				recebido = resultado

				return 0
			}

			executaRoll(strings.NewReader(resposta), &stdout, buscaOk(t), adicionar)

			if !chamado {
				t.Fatal("o fluxo de adição deveria ter sido chamado")
			}
			if recebido.Species.Number < 1 || recebido.Species.Number > 151 {
				t.Errorf("resultado repassado inválido: %+v", recebido)
			}
			if !strings.Contains(stdout.String(), recebido.Species.DisplayName) {
				t.Error("o resultado repassado não é o que foi exibido")
			}
		})
	}
}

func TestExecutaRollReperguntaEmRespostaInvalida(t *testing.T) {
	var stdout bytes.Buffer

	executaRoll(strings.NewReader("talvez\n42\nn\n"), &stdout, buscaOk(t), adicaoNaoChamada(t))

	saida := stdout.String()
	if got := strings.Count(saida, mensagemResposta); got != 2 {
		t.Errorf("avisos de resposta inválida = %d, esperado 2: %q", got, saida)
	}
	if got := strings.Count(saida, perguntaDeAdicao); got != 3 {
		t.Errorf("perguntas = %d, esperado 3", got)
	}
}

func TestExecutaRollTrataEntradaFechadaComoNao(t *testing.T) {
	var stdout bytes.Buffer

	code := executaRoll(strings.NewReader(""), &stdout, buscaOk(t), adicaoNaoChamada(t))

	if code != 0 {
		t.Errorf("executaRoll() = %d, esperado 0", code)
	}
	if !strings.Contains(stdout.String(), mensagemDescartado) {
		t.Errorf("entrada fechada deveria descartar: %q", stdout.String())
	}
}

func TestUsoListaOComandoRoll(t *testing.T) {
	var stdout, stderr bytes.Buffer

	run(nil, strings.NewReader(""), &stdout, &stderr)

	if !bytes.Contains(stdout.Bytes(), []byte("roll")) {
		t.Errorf("texto de uso não menciona o comando roll: %q", stdout.String())
	}
}
