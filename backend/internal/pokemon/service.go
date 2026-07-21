package pokemon

import (
	"context"
	"errors"
	"fmt"

	"github.com/JoaoVictorVM/homedex/backend/internal/collection"
	"github.com/JoaoVictorVM/homedex/backend/internal/pokeapi"
)

type collections interface {
	Get(ctx context.Context, rawCode string) (collection.Collection, error)
}

type pokedex interface {
	Pokemon(ctx context.Context, name string) (pokeapi.Pokemon, error)
	Sprite(ctx context.Context, name string, form string, shiny bool) (string, error)
}

type Service struct {
	repo        *Repository
	collections collections
	pokedex     pokedex
}

func NewService(repo *Repository, collections collections, pokedex pokedex) *Service {
	return &Service{repo: repo, collections: collections, pokedex: pokedex}
}

func (s *Service) Create(ctx context.Context, rawCode string, novo NewPokemon) (Pokemon, error) {
	owner, err := s.collections.Get(ctx, rawCode)
	if err != nil {
		return Pokemon{}, err
	}

	if !validGender(novo.Gender) {
		return Pokemon{}, ErrInvalidGender
	}
	if novo.BoxNumber < 1 || novo.BoxNumber > owner.BoxCount {
		return Pokemon{}, ErrInvalidPosition
	}
	if novo.Slot < 0 || novo.Slot >= SlotsPerBox {
		return Pokemon{}, ErrInvalidPosition
	}

	species, err := s.pokedex.Pokemon(ctx, novo.PokemonName)
	if err != nil {
		return Pokemon{}, fmt.Errorf("validar pokémon informado: %w", err)
	}
	novo.PokemonName = species.Name

	created, err := s.repo.Insert(ctx, owner.ID, novo)
	if err != nil {
		return Pokemon{}, err
	}

	created.Sprite = s.sprite(ctx, created)

	return created, nil
}

func (s *Service) sprite(ctx context.Context, p Pokemon) string {
	url, err := s.pokedex.Sprite(ctx, p.PokemonName, p.Form, p.IsShiny)
	if err != nil && !errors.Is(err, pokeapi.ErrNoSprite) {
		return ""
	}

	return url
}
