package sprite

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	_ "image/png"
	"strings"
)

const (
	Ramp           = " .:-=+*#%@"
	DefaultColumns = 80

	cellAspect = 2
)

var ErrImagemVazia = errors.New("imagem da sprite está totalmente transparente")

func Convert(data []byte, columns int) (string, error) {
	if columns <= 0 {
		columns = DefaultColumns
	}

	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("decodificar imagem da sprite: %w", err)
	}

	area := opaqueBounds(img)
	if area.Empty() {
		return "", ErrImagemVazia
	}

	largura := min(columns, area.Dx())
	celula := float64(area.Dx()) / float64(largura)
	altura := max(1, int(float64(area.Dy())/(celula*cellAspect)))

	var out strings.Builder
	for linha := 0; linha < altura; linha++ {
		for coluna := 0; coluna < largura; coluna++ {
			bloco := image.Rect(
				area.Min.X+int(float64(coluna)*celula),
				area.Min.Y+int(float64(linha)*celula*cellAspect),
				area.Min.X+int(float64(coluna+1)*celula),
				area.Min.Y+int(float64(linha+1)*celula*cellAspect),
			)

			out.WriteByte(Ramp[rampIndex(brilhoMedio(img, bloco.Intersect(area)))])
		}
		out.WriteByte('\n')
	}

	return out.String(), nil
}

func rampIndex(brilho float64) int {
	escuridao := 1 - brilho

	indice := int(escuridao*float64(len(Ramp)-1) + 0.5)

	return min(max(indice, 0), len(Ramp)-1)
}

func brilhoMedio(img image.Image, bloco image.Rectangle) float64 {
	if bloco.Empty() {
		return 1
	}

	var soma float64
	var pixels float64

	for y := bloco.Min.Y; y < bloco.Max.Y; y++ {
		for x := bloco.Min.X; x < bloco.Max.X; x++ {
			soma += brilhoSobreBrancoR(img, x, y)
			pixels++
		}
	}

	if pixels == 0 {
		return 1
	}

	return soma / pixels
}

func brilhoSobreBrancoR(img image.Image, x int, y int) float64 {
	r, g, b, a := img.At(x, y).RGBA()

	transparencia := float64(0xFFFF - a)

	vermelho := (float64(r) + transparencia) / 0xFFFF
	verde := (float64(g) + transparencia) / 0xFFFF
	azul := (float64(b) + transparencia) / 0xFFFF

	return 0.299*vermelho + 0.587*verde + 0.114*azul
}

func opaqueBounds(img image.Image) image.Rectangle {
	limites := img.Bounds()

	minX, minY := limites.Max.X, limites.Max.Y
	maxX, maxY := limites.Min.X, limites.Min.Y

	for y := limites.Min.Y; y < limites.Max.Y; y++ {
		for x := limites.Min.X; x < limites.Max.X; x++ {
			if _, _, _, a := img.At(x, y).RGBA(); a == 0 {
				continue
			}

			minX = min(minX, x)
			minY = min(minY, y)
			maxX = max(maxX, x+1)
			maxY = max(maxY, y+1)
		}
	}

	if minX >= maxX || minY >= maxY {
		return image.Rectangle{}
	}

	return image.Rect(minX, minY, maxX, maxY)
}
