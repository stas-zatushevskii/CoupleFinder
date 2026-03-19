package service

import (
	"context"
	"fmt"

	"backend/internal/domain"
	"backend/internal/repository"
)

type MatchService struct {
	userRepo repository.UserRepository
	runRepo  repository.RunRepository
	algs     map[string]domain.MatchingAlgorithm
}

func NewMatchService(
	userRepo repository.UserRepository,
	runRepo repository.RunRepository,
	algorithms ...domain.MatchingAlgorithm,
) *MatchService {
	m := make(map[string]domain.MatchingAlgorithm, len(algorithms))
	for _, alg := range algorithms {
		m[alg.Name()] = alg
	}

	return &MatchService{
		userRepo: userRepo,
		runRepo:  runRepo,
		algs:     m,
	}
}

func (s *MatchService) Run(ctx context.Context, algorithmName string, limit int) (domain.RunResult, error) {
	alg, ok := s.algs[algorithmName]
	if !ok {
		return domain.RunResult{}, fmt.Errorf("unknown algorithm: %s", algorithmName)
	}

	users, err := s.userRepo.ListUsersForMatching(ctx, limit)
	if err != nil {
		return domain.RunResult{}, err
	}

	result, err := alg.Run(ctx, users)
	if err != nil {
		return domain.RunResult{}, err
	}

	if err := s.runRepo.SaveRunResult(ctx, result, len(users)); err != nil {
		return domain.RunResult{}, err
	}

	return result, nil
}

func (s *MatchService) CompareAll(ctx context.Context, limit int) ([]domain.RunResult, error) {
	users, err := s.userRepo.ListUsersForMatching(ctx, limit)
	if err != nil {
		return nil, err
	}

	results := make([]domain.RunResult, 0, len(s.algs))

	for _, alg := range s.algs {
		result, err := alg.Run(ctx, users)
		if err != nil {
			return nil, err
		}

		if err := s.runRepo.SaveRunResult(ctx, result, len(users)); err != nil {
			return nil, err
		}

		results = append(results, result)
	}

	return results, nil
}
