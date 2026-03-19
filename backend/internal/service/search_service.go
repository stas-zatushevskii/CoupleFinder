package service

import (
	"context"
	"sort"
	"time"

	"backend/internal/domain"
	"backend/internal/repository"
)

type SearchService struct {
	userRepo repository.UserRepository
	scorer   interface {
		ScoreBySearch(filters domain.SearchFilters, candidate domain.User) float64
	}
}

func NewSearchService(
	userRepo repository.UserRepository,
	scorer interface {
		ScoreBySearch(filters domain.SearchFilters, candidate domain.User) float64
	},
) *SearchService {
	return &SearchService{
		userRepo: userRepo,
		scorer:   scorer,
	}
}

func (s *SearchService) Run(ctx context.Context, req domain.SearchRequest) (domain.SearchResult, error) {
	start := time.Now()

	users, err := s.userRepo.ListUsersForSearch(ctx, req.Limit)
	if err != nil {
		return domain.SearchResult{}, err
	}

	candidates := make([]domain.CandidateResult, 0, len(users))

	for _, user := range users {
		score := s.scorer.ScoreBySearch(req.Filters, user)
		if score <= 0 {
			continue
		}

		candidates = append(candidates, domain.CandidateResult{
			User:  user,
			Score: score,
		})
	}

	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].Score > candidates[j].Score
	})

	return domain.SearchResult{
		AlgorithmName:   req.Algorithm,
		ExecutionTimeMs: time.Since(start).Milliseconds(),
		Candidates:      candidates,
	}, nil
}
