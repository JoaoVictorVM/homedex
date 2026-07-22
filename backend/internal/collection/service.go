package collection

import (
	"context"
	"errors"
	"fmt"
)

const maxCodeAttempts = 5

type Service struct {
	repo          *Repository
	officialGames []string
}

func NewService(repo *Repository, officialGames []string) *Service {
	return &Service{repo: repo, officialGames: officialGames}
}

func (s *Service) Create(ctx context.Context) (Collection, error) {
	for range maxCodeAttempts {
		code, err := NewCode()
		if err != nil {
			return Collection{}, err
		}

		created, err := s.repo.Insert(ctx, code, s.officialGames)
		if err == nil {
			return created, nil
		}
		if !errors.Is(err, errCodeTaken) {
			return Collection{}, err
		}
	}

	return Collection{}, fmt.Errorf(
		"gerar código único após %d tentativas: %w", maxCodeAttempts, errCodeTaken,
	)
}

func (s *Service) AddBox(ctx context.Context, rawCode string) (Collection, error) {
	code, err := ParseCode(rawCode)
	if err != nil {
		return Collection{}, err
	}

	return s.repo.AddBox(ctx, code)
}

func (s *Service) Get(ctx context.Context, rawCode string) (Collection, error) {
	code, err := ParseCode(rawCode)
	if err != nil {
		return Collection{}, err
	}

	return s.repo.FindByCode(ctx, code)
}
