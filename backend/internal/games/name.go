package games

import (
	"errors"
	"strings"
	"unicode/utf8"
)

const maxNameLength = 60

var (
	ErrInvalidName = errors.New("nome de jogo inválido")
	ErrNameTaken   = errors.New("já existe um jogo com esse nome na coleção")
	ErrNotFound    = errors.New("jogo não encontrado")
	ErrInUse       = errors.New("jogo possui Pokémon vinculados")
	ErrOfficial    = errors.New("jogo oficial não pode ser renomeado nem excluído")
)

func ParseName(raw string) (string, error) {
	name := strings.Join(strings.Fields(raw), " ")

	if name == "" || utf8.RuneCountInString(name) > maxNameLength {
		return "", ErrInvalidName
	}

	return name, nil
}
