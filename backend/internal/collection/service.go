package collection

import (
	"context"
	"errors"
	"fmt"
)

const maxCodeAttempts = 5

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context) (Collection, error) {
	for range maxCodeAttempts {
		code, err := NewCode()
		if err != nil {
			return Collection{}, err
		}

		created, err := s.repo.Insert(ctx, code)
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
