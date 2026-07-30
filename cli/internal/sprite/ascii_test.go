package sprite

import (
	"bytes"
	"errors"
	"image"
	"image/color"
	"image/png"
	"strings"
	"testing"
)

func pngDeTeste(t *testing.T, largura int, altura int, pinta func(x int, y int) color.Color) []byte {
	t.Helper()

	img := image.NewRGBA(image.Rect(0, 0, largura, altura))
	for y := 0; y < altura; y++ {
		for x := 0; x < largura; x++ {
			img.Set(x, y, pinta(x, y))
		}
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("codificar png de teste: %v", err)
	}

	return buf.Bytes()
}

func gradiente(largura int) func(int, int) color.Color {
	return func(x int, _ int) color.Color {
		nivel := uint8(x * 255 / max(largura-1, 1))

		return color.RGBA{R: nivel, G: nivel, B: nivel, A: 255}
	}
}

func TestConvertUsaSomenteOsCaracteresDaRampa(t *testing.T) {
	data := pngDeTeste(t, 96, 96, gradiente(96))

	art, err := Convert(data, 80)
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	for _, r := range art {
		if r == '\n' {
			continue
		}
		if !strings.ContainsRune(Ramp, r) {
			t.Errorf("caractere %q fora da rampa %q", r, Ramp)
		}
	}
}

func TestConvertNaoPassaDe80Colunas(t *testing.T) {
	data := pngDeTeste(t, 300, 300, gradiente(300))

	art, err := Convert(data, DefaultColumns)
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	for i, linha := range strings.Split(strings.TrimRight(art, "\n"), "\n") {
		if len(linha) > DefaultColumns {
			t.Errorf("linha %d tem %d colunas, máximo %d", i, len(linha), DefaultColumns)
		}
	}
}

func TestConvertRespeitaOLimiteDeColunasPedido(t *testing.T) {
	data := pngDeTeste(t, 96, 96, gradiente(96))

	art, err := Convert(data, 20)
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	for i, linha := range strings.Split(strings.TrimRight(art, "\n"), "\n") {
		if len(linha) != 20 {
			t.Errorf("linha %d tem %d colunas, esperado 20", i, len(linha))
		}
	}
}

func TestConvertNaoEmiteCodigoDeCor(t *testing.T) {
	data := pngDeTeste(t, 96, 96, func(x int, y int) color.Color {
		return color.RGBA{R: uint8(x * 2), G: uint8(y * 2), B: 200, A: 255}
	})

	art, err := Convert(data, 60)
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	if strings.ContainsRune(art, '\x1b') {
		t.Error("saída contém sequência de escape ANSI")
	}
}

func TestConvertMapeiaPretoEBrancoNasPontasDaRampa(t *testing.T) {
	preto := pngDeTeste(t, 40, 40, func(int, int) color.Color { return color.RGBA{A: 255} })
	branco := pngDeTeste(t, 40, 40, func(int, int) color.Color { return color.RGBA{R: 255, G: 255, B: 255, A: 255} })

	artPreto, err := Convert(preto, 10)
	if err != nil {
		t.Fatalf("preto: erro inesperado: %v", err)
	}
	if got := strings.Trim(artPreto, "\n"); strings.Trim(got, string(Ramp[len(Ramp)-1])+"\n") != "" {
		t.Errorf("imagem preta deveria virar só %q, veio %q", Ramp[len(Ramp)-1], got)
	}

	artBranco, err := Convert(branco, 10)
	if err != nil {
		t.Fatalf("branco: erro inesperado: %v", err)
	}
	if got := strings.Trim(artBranco, "\n"); strings.Trim(got, string(Ramp[0])+"\n") != "" {
		t.Errorf("imagem branca deveria virar só espaço, veio %q", got)
	}
}

func TestConvertTrataFundoTransparenteComoVazio(t *testing.T) {
	data := pngDeTeste(t, 40, 40, func(x int, y int) color.Color {
		if x >= 10 && x < 30 && y >= 10 && y < 30 {
			return color.RGBA{A: 255}
		}

		return color.RGBA{}
	})

	art, err := Convert(data, 20)
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	if strings.ContainsRune(art, ' ') {
		t.Errorf("a área transparente deveria ter sido recortada, veio %q", art)
	}
}

func TestConvertImagemTotalmenteTransparente(t *testing.T) {
	data := pngDeTeste(t, 20, 20, func(int, int) color.Color { return color.RGBA{} })

	if _, err := Convert(data, 40); !errors.Is(err, ErrImagemVazia) {
		t.Errorf("erro = %v, esperado ErrImagemVazia", err)
	}
}

func TestConvertDadosInvalidos(t *testing.T) {
	if _, err := Convert([]byte("isto não é um png"), 40); err == nil {
		t.Error("esperado erro ao decodificar dados inválidos")
	}
}

func TestConvertColunasNaoPositivasCaemNoPadrao(t *testing.T) {
	data := pngDeTeste(t, 200, 200, gradiente(200))

	art, err := Convert(data, 0)
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	primeira := strings.Split(art, "\n")[0]
	if len(primeira) != DefaultColumns {
		t.Errorf("largura = %d, esperado o padrão %d", len(primeira), DefaultColumns)
	}
}
