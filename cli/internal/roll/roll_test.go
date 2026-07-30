package roll

import (
	"math"
	"math/rand/v2"
	"testing"

	"github.com/JoaoVictorVM/homedex/cli/internal/pokedex"
)

type fonteControlada struct {
	especie int
	sexo    int
	shiny   int
}

func (f fonteControlada) IntN(n int) int {
	switch n {
	case pokedex.Len():
		return f.especie
	case 2:
		return f.sexo
	case ShinyOdds:
		return f.shiny
	}

	return 0
}

func fonteSemeada() *rand.Rand {
	return rand.New(rand.NewPCG(1, 2))
}

func TestRollSempreRetornaEspecieEntre1E151(t *testing.T) {
	fonte := fonteSemeada()

	for i := 0; i < 10_000; i++ {
		resultado := RollWith(fonte)

		if resultado.Species.Number < 1 || resultado.Species.Number > 151 {
			t.Fatalf("número fora da faixa de Kanto: %d (%s)", resultado.Species.Number, resultado.Species.Name)
		}
	}
}

func TestRollNuncaAtribuiSexoAEspecieSemSexo(t *testing.T) {
	for indice := 0; indice < pokedex.Len(); indice++ {
		especie := pokedex.At(indice)
		if especie.Gender != pokedex.Genderless {
			continue
		}

		for sexo := 0; sexo < 2; sexo++ {
			resultado := RollWith(fonteControlada{especie: indice, sexo: sexo})

			if resultado.Gender != Genderless {
				t.Errorf("#%03d %s: Gender = %q, esperado %q", especie.Number, especie.Name, resultado.Gender, Genderless)
			}
		}
	}
}

func TestRollRespeitaEspeciesDeSexoUnico(t *testing.T) {
	for indice := 0; indice < pokedex.Len(); indice++ {
		especie := pokedex.At(indice)

		var esperado Gender
		switch especie.Gender {
		case pokedex.MaleOnly:
			esperado = Male
		case pokedex.FemaleOnly:
			esperado = Female
		case pokedex.Both, pokedex.Genderless:
			continue
		}

		for sexo := 0; sexo < 2; sexo++ {
			resultado := RollWith(fonteControlada{especie: indice, sexo: sexo})

			if resultado.Gender != esperado {
				t.Errorf("#%03d %s: Gender = %q, esperado %q", especie.Number, especie.Name, resultado.Gender, esperado)
			}
		}
	}
}

func TestRollSorteiaMachoEFemeaParaEspecieComOsDoisSexos(t *testing.T) {
	indice := -1
	for i := 0; i < pokedex.Len(); i++ {
		if pokedex.At(i).Gender == pokedex.Both {
			indice = i
			break
		}
	}
	if indice < 0 {
		t.Fatal("nenhuma espécie com os dois sexos no dataset")
	}

	if got := RollWith(fonteControlada{especie: indice, sexo: 0}).Gender; got != Male {
		t.Errorf("sexo = %q com sorteio 0, esperado %q", got, Male)
	}
	if got := RollWith(fonteControlada{especie: indice, sexo: 1}).Gender; got != Female {
		t.Errorf("sexo = %q com sorteio 1, esperado %q", got, Female)
	}
}

func TestRollConvergeParaUmShinyACada20(t *testing.T) {
	const amostras = 100_000

	fonte := fonteSemeada()

	shinies := 0
	for i := 0; i < amostras; i++ {
		if RollWith(fonte).Shiny {
			shinies++
		}
	}

	taxa := float64(shinies) / amostras
	esperada := 1.0 / ShinyOdds

	if math.Abs(taxa-esperada) > 0.005 {
		t.Errorf("taxa de shiny = %.4f (%d em %d), esperada ~%.4f", taxa, shinies, amostras, esperada)
	}
}

func TestRollDistribuiEspeciesPorTodoODataset(t *testing.T) {
	fonte := fonteSemeada()

	vistos := make(map[int]struct{}, pokedex.Len())
	for i := 0; i < 100_000; i++ {
		vistos[RollWith(fonte).Species.Number] = struct{}{}
	}

	if len(vistos) != pokedex.Len() {
		t.Errorf("apenas %d espécies distintas sorteadas em 100000 rolls, esperado %d", len(vistos), pokedex.Len())
	}
}

func TestRollUsaAFonteGlobalSemPanico(t *testing.T) {
	resultado := Roll()

	if resultado.Species.Number < 1 || resultado.Species.Number > 151 {
		t.Errorf("número fora da faixa de Kanto: %d", resultado.Species.Number)
	}
	if resultado.Gender != Male && resultado.Gender != Female && resultado.Gender != Genderless {
		t.Errorf("sexo inesperado: %q", resultado.Gender)
	}
}
