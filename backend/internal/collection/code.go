package collection

import (
	"errors"
	"fmt"
	"strings"

	gonanoid "github.com/matoous/go-nanoid/v2"
)

const (
	codeAlphabet  = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
	CodeLength    = 8
	codeSeparator = "-"
)

var ErrInvalidCode = errors.New("código de coleção inválido")

func NewCode() (string, error) {
	code, err := gonanoid.Generate(codeAlphabet, CodeLength)
	if err != nil {
		return "", fmt.Errorf("gerar código da coleção: %w", err)
	}

	return code, nil
}

func ParseCode(raw string) (string, error) {
	normalized := strings.ToUpper(strings.TrimSpace(raw))
	normalized = strings.ReplaceAll(normalized, codeSeparator, "")

	if len(normalized) != CodeLength {
		return "", ErrInvalidCode
	}

	for _, r := range normalized {
		if !strings.ContainsRune(codeAlphabet, r) {
			return "", ErrInvalidCode
		}
	}

	return normalized, nil
}
