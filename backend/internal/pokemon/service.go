package pokemon

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sync"

	"github.com/JoaoVictorVM/homedex/backend/internal/collection"
	"github.com/JoaoVictorVM/homedex/backend/internal/pokeapi"
)

const maxParallelSprites = 8

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

func (s *Service) Update(ctx context.Context, rawCode string, pokemonID int64, edit EditPokemon) (Pokemon, error) {
	owner, err := s.collections.Get(ctx, rawCode)
	if err != nil {
		return Pokemon{}, err
	}

	if !validGender(edit.Gender) {
		return Pokemon{}, ErrInvalidGender
	}

	species, err := s.pokedex.Pokemon(ctx, edit.PokemonName)
	if err != nil {
		return Pokemon{}, fmt.Errorf("validar pokémon informado: %w", err)
	}
	edit.PokemonName = species.Name

	updated, err := s.repo.Update(ctx, owner.ID, pokemonID, edit)
	if err != nil {
		return Pokemon{}, err
	}

	updated.Sprite = s.sprite(ctx, updated)

	return updated, nil
}

func (s *Service) Delete(ctx context.Context, rawCode string, pokemonID int64) error {
	owner, err := s.collections.Get(ctx, rawCode)
	if err != nil {
		return err
	}

	return s.repo.Delete(ctx, owner.ID, pokemonID)
}

func (s *Service) ListByBox(ctx context.Context, rawCode string, boxNumber int) ([]Pokemon, error) {
	owner, err := s.collections.Get(ctx, rawCode)
	if err != nil {
		return nil, err
	}

	if boxNumber < 1 || boxNumber > owner.BoxCount {
		return nil, ErrInvalidPosition
	}

	found, err := s.repo.ListByBox(ctx, owner.ID, boxNumber)
	if err != nil {
		return nil, err
	}

	s.fillSprites(ctx, found)

	return found, nil
}

func (s *Service) fillSprites(ctx context.Context, list []Pokemon) {
	sem := make(chan struct{}, maxParallelSprites)

	var wg sync.WaitGroup
	for i := range list {
		wg.Add(1)
		go func() {
			defer wg.Done()

			sem <- struct{}{}
			defer func() { <-sem }()

			list[i].Sprite = s.sprite(ctx, list[i])
		}()
	}

	wg.Wait()
}

func (s *Service) sprite(ctx context.Context, p Pokemon) string {
	url, err := s.pokedex.Sprite(ctx, p.PokemonName, p.Form, p.IsShiny)
	if err != nil {
		if !errors.Is(err, pokeapi.ErrNoSprite) {
			slog.Warn("resolver sprite", "pokemon", p.PokemonName, "forma", p.Form, "erro", err)
		}
		return ""
	}

	return url
}
