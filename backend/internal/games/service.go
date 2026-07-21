package games

import (
	"context"

	"github.com/JoaoVictorVM/homedex/backend/internal/collection"
)

type collections interface {
	Get(ctx context.Context, rawCode string) (collection.Collection, error)
}

type Service struct {
	repo        *Repository
	collections collections
}

func NewService(repo *Repository, collections collections) *Service {
	return &Service{repo: repo, collections: collections}
}

func (s *Service) List(ctx context.Context, rawCode string) ([]Game, error) {
	owner, err := s.collections.Get(ctx, rawCode)
	if err != nil {
		return nil, err
	}

	return s.repo.ListByCollection(ctx, owner.ID)
}

func (s *Service) Create(ctx context.Context, rawCode string, rawName string) (Game, error) {
	owner, err := s.collections.Get(ctx, rawCode)
	if err != nil {
		return Game{}, err
	}

	name, err := ParseName(rawName)
	if err != nil {
		return Game{}, err
	}

	return s.repo.Insert(ctx, owner.ID, name)
}
