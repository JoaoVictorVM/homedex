package pokedex

import "testing"

func TestDatasetTem151Entradas(t *testing.T) {
	if Len() != 151 {
		t.Fatalf("Len() = %d, esperado 151", Len())
	}
}

func TestDatasetCobreOsNumerosDe1A151SemFalhaNemDuplicata(t *testing.T) {
	vistos := make(map[int]string, Len())

	for _, especie := range All() {
		if anterior, duplicado := vistos[especie.Number]; duplicado {
			t.Fatalf("número %d duplicado entre %q e %q", especie.Number, anterior, especie.Name)
		}
		vistos[especie.Number] = especie.Name
	}

	for numero := 1; numero <= 151; numero++ {
		if _, ok := vistos[numero]; !ok {
			t.Errorf("número %d ausente do dataset", numero)
		}
	}
}

func TestDatasetNaoTemNomeVazio(t *testing.T) {
	for _, especie := range All() {
		if especie.Name == "" {
			t.Errorf("#%03d está sem Name", especie.Number)
		}
		if especie.DisplayName == "" {
			t.Errorf("#%03d está sem DisplayName", especie.Number)
		}
	}
}

func TestDatasetTemAsEspeciesSemSexoConhecidas(t *testing.T) {
	esperados := map[int]bool{81: true, 82: true, 100: true, 101: true, 120: true, 121: true, 132: true, 137: true, 144: true, 145: true, 146: true, 150: true, 151: true}

	for _, especie := range All() {
		semSexo := especie.Gender == Genderless
		if semSexo != esperados[especie.Number] {
			t.Errorf("#%03d %s: Genderless = %v, esperado %v", especie.Number, especie.Name, semSexo, esperados[especie.Number])
		}
	}
}

func TestDatasetTemAsEspeciesDeSexoUnicoConhecidas(t *testing.T) {
	soMacho := map[int]bool{32: true, 33: true, 34: true, 106: true, 107: true, 128: true}
	soFemea := map[int]bool{29: true, 30: true, 31: true, 113: true, 115: true, 124: true}

	for _, especie := range All() {
		if (especie.Gender == MaleOnly) != soMacho[especie.Number] {
			t.Errorf("#%03d %s: MaleOnly = %v, esperado %v", especie.Number, especie.Name, especie.Gender == MaleOnly, soMacho[especie.Number])
		}
		if (especie.Gender == FemaleOnly) != soFemea[especie.Number] {
			t.Errorf("#%03d %s: FemaleOnly = %v, esperado %v", especie.Number, especie.Name, especie.Gender == FemaleOnly, soFemea[especie.Number])
		}
	}
}

func TestAllNaoExpoeOSliceInterno(t *testing.T) {
	original := At(0)

	copia := All()
	copia[0].Name = "alterado"

	if At(0) != original {
		t.Errorf("All() expôs o slice interno: At(0) virou %+v", At(0))
	}
}
