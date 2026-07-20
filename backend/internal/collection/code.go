package collection

import (
	"fmt"

	gonanoid "github.com/matoous/go-nanoid/v2"
)

const (
	codeAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
	CodeLength   = 8
)

func NewCode() (string, error) {
	code, err := gonanoid.Generate(codeAlphabet, CodeLength)
	if err != nil {
		return "", fmt.Errorf("gerar código da coleção: %w", err)
	}

	return code, nil
}
