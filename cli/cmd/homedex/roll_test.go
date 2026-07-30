package main

import (
	"bytes"
	"context"
	"errors"
	"image"
	"image/color"
	"image/png"
	"regexp"
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

func TestExecutaRollImprimeEspecieSexoEShiny(t *testing.T) {
	var stdout bytes.Buffer

	buscar := func(context.Context, string, bool) ([]byte, error) { return pngDeTeste(t), nil }

	if code := executaRoll(&stdout, buscar); code != 0 {
		t.Fatalf("executaRoll() = %d, esperado 0", code)
	}

	cabecalho := regexp.MustCompile(`^#\d{3} .+\nSexo: (macho|fêmea|sem sexo)\nShiny: (sim|não)\n`)
	if !cabecalho.MatchString(stdout.String()) {
		t.Errorf("cabeçalho fora do formato esperado: %q", stdout.String())
	}
}

func TestExecutaRollRenderizaAArteQuandoABuscaFunciona(t *testing.T) {
	var stdout bytes.Buffer

	buscar := func(context.Context, string, bool) ([]byte, error) { return pngDeTeste(t), nil }

	executaRoll(&stdout, buscar)

	saida := stdout.String()
	if strings.Contains(saida, mensagemSemArte) {
		t.Errorf("não deveria ter caído no fallback: %q", saida)
	}

	partes := strings.SplitN(saida, "\n\n", 2)
	if len(partes) != 2 {
		t.Fatalf("saída sem separação entre detalhes e arte: %q", saida)
	}

	arte := partes[1]
	if strings.TrimSpace(arte) == "" {
		t.Error("nenhuma arte foi impressa")
	}
	for _, r := range strings.ReplaceAll(arte, "\n", "") {
		if !strings.ContainsRune(sprite.Ramp, r) {
			t.Errorf("caractere %q fora da rampa", r)
		}
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
	executaRoll(&stdout, buscar)

	if chamadas != 1 {
		t.Fatalf("buscas = %d, esperado 1", chamadas)
	}

	encontrado := false
	for _, especie := range pokedex.All() {
		if especie.Name == nomePedido {
			encontrado = true

			if !strings.Contains(stdout.String(), especie.DisplayName) {
				t.Errorf("buscou %q mas imprimiu outra espécie: %q", nomePedido, stdout.String())
			}

			break
		}
	}
	if !encontrado {
		t.Errorf("nome pedido %q não é um identificador do dataset", nomePedido)
	}

	temShiny := strings.Contains(stdout.String(), "Shiny: sim")
	if shinyPedido != temShiny {
		t.Errorf("pediu shiny=%v mas imprimiu shiny=%v", shinyPedido, temShiny)
	}
}

func TestExecutaRollCaiNoFallbackQuandoABuscaFalha(t *testing.T) {
	var stdout bytes.Buffer

	buscar := func(context.Context, string, bool) ([]byte, error) {
		return nil, errors.New("rede indisponível")
	}

	if code := executaRoll(&stdout, buscar); code != 0 {
		t.Fatalf("executaRoll() = %d, esperado 0 mesmo com falha na sprite", code)
	}

	saida := stdout.String()
	if !strings.Contains(saida, mensagemSemArte) {
		t.Errorf("saída não traz a mensagem de fallback: %q", saida)
	}
	if !strings.Contains(saida, "Sexo:") || !strings.Contains(saida, "Shiny:") {
		t.Errorf("os detalhes do roll deveriam continuar visíveis: %q", saida)
	}
}

func TestExecutaRollCaiNoFallbackQuandoAImagemNaoDecodifica(t *testing.T) {
	var stdout bytes.Buffer

	buscar := func(context.Context, string, bool) ([]byte, error) {
		return []byte("isto não é um png"), nil
	}

	if code := executaRoll(&stdout, buscar); code != 0 {
		t.Fatalf("executaRoll() = %d, esperado 0", code)
	}
	if !strings.Contains(stdout.String(), mensagemSemArte) {
		t.Errorf("saída não traz a mensagem de fallback: %q", stdout.String())
	}
}

func TestFormataResultado(t *testing.T) {
	casos := []struct {
		nome      string
		resultado roll.Result
		esperado  string
	}{
		{
			nome:      "macho normal",
			resultado: roll.Result{Species: pokedex.Species{Number: 25, DisplayName: "Pikachu"}, Gender: roll.Male},
			esperado:  "#025 Pikachu\nSexo: macho\nShiny: não\n\n",
		},
		{
			nome:      "fêmea shiny",
			resultado: roll.Result{Species: pokedex.Species{Number: 113, DisplayName: "Chansey"}, Gender: roll.Female, Shiny: true},
			esperado:  "#113 Chansey\nSexo: fêmea\nShiny: sim\n\n",
		},
		{
			nome:      "sem sexo",
			resultado: roll.Result{Species: pokedex.Species{Number: 132, DisplayName: "Ditto"}, Gender: roll.Genderless},
			esperado:  "#132 Ditto\nSexo: sem sexo\nShiny: não\n\n",
		},
		{
			nome:      "numero de tres digitos",
			resultado: roll.Result{Species: pokedex.Species{Number: 151, DisplayName: "Mew"}, Gender: roll.Genderless, Shiny: true},
			esperado:  "#151 Mew\nSexo: sem sexo\nShiny: sim\n\n",
		},
	}

	for _, caso := range casos {
		t.Run(caso.nome, func(t *testing.T) {
			if got := formataResultado(caso.resultado); got != caso.esperado {
				t.Errorf("formataResultado() = %q, esperado %q", got, caso.esperado)
			}
		})
	}
}

func TestUsoListaOComandoRoll(t *testing.T) {
	var stdout, stderr bytes.Buffer

	run(nil, &stdout, &stderr)

	if !bytes.Contains(stdout.Bytes(), []byte("roll")) {
		t.Errorf("texto de uso não menciona o comando roll: %q", stdout.String())
	}
}
