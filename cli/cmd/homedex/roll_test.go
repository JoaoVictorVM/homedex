package main

import (
	"bytes"
	"regexp"
	"testing"

	"github.com/JoaoVictorVM/homedex/cli/internal/pokedex"
	"github.com/JoaoVictorVM/homedex/cli/internal/roll"
)

func TestRunRollImprimeEspecieSexoEShiny(t *testing.T) {
	var stdout, stderr bytes.Buffer

	if code := run([]string{"roll"}, &stdout, &stderr); code != 0 {
		t.Fatalf("run() = %d, esperado 0", code)
	}
	if stderr.Len() != 0 {
		t.Errorf("stderr deveria estar vazio, veio %q", stderr.String())
	}

	padrao := regexp.MustCompile(`^#\d{3} .+\nSexo: (macho|fêmea|sem sexo)\nShiny: (sim|não)\n$`)
	if !padrao.MatchString(stdout.String()) {
		t.Errorf("saída fora do formato esperado: %q", stdout.String())
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
			esperado:  "#025 Pikachu\nSexo: macho\nShiny: não\n",
		},
		{
			nome:      "fêmea shiny",
			resultado: roll.Result{Species: pokedex.Species{Number: 113, DisplayName: "Chansey"}, Gender: roll.Female, Shiny: true},
			esperado:  "#113 Chansey\nSexo: fêmea\nShiny: sim\n",
		},
		{
			nome:      "sem sexo",
			resultado: roll.Result{Species: pokedex.Species{Number: 132, DisplayName: "Ditto"}, Gender: roll.Genderless},
			esperado:  "#132 Ditto\nSexo: sem sexo\nShiny: não\n",
		},
		{
			nome:      "numero de tres digitos",
			resultado: roll.Result{Species: pokedex.Species{Number: 151, DisplayName: "Mew"}, Gender: roll.Genderless, Shiny: true},
			esperado:  "#151 Mew\nSexo: sem sexo\nShiny: sim\n",
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
