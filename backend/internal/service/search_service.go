package service

import (
	"context"
	"math"
	"sort"
	"time"

	"backend/internal/domain"
	"backend/internal/repository"
)

type SearchService struct {
	userRepo repository.UserRepository
	runRepo  repository.RunRepository
	scorer   interface {
		ScoreBySearch(filters domain.SearchFilters, candidate domain.User) float64
	}
}

func NewSearchService(
	userRepo repository.UserRepository,
	runRepo repository.RunRepository,
	scorer interface {
		ScoreBySearch(filters domain.SearchFilters, candidate domain.User) float64
	},
) *SearchService {
	return &SearchService{
		userRepo: userRepo,
		runRepo:  runRepo,
		scorer:   scorer,
	}
}

func (s *SearchService) Run(ctx context.Context, req domain.SearchRequest) (domain.SearchResult, error) {
	start := time.Now()

	users, err := s.userRepo.ListUsersForSearch(ctx, req.Limit, req.Filters)
	if err != nil {
		return domain.SearchResult{}, err
	}

	candidates := make([]domain.CandidateResult, 0, len(users))
	var scoreCalls int64

	for _, user := range users {
		score := s.scorer.ScoreBySearch(req.Filters, user)
		scoreCalls++

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

	execMs := time.Since(start).Milliseconds()

	result := domain.SearchResult{
		AlgorithmName:   req.Algorithm,
		ExecutionTimeMs: execMs,
		Candidates:      candidates,
	}

	runResult := buildRunResultFromSearch(result, len(users), scoreCalls)

	if err := s.runRepo.SaveRunResult(ctx, runResult); err != nil {
		return domain.SearchResult{}, err
	}

	return result, nil
}

func buildRunResultFromSearch(
	result domain.SearchResult,
	usersCount int,
	scoreCalls int64,
) domain.RunResult {
	stats := calcCandidateStats(result.Candidates)

	unmatchedUsers := usersCount - len(result.Candidates)
	if unmatchedUsers < 0 {
		unmatchedUsers = 0
	}

	coverageRatio := 0.0
	if usersCount > 0 {
		coverageRatio = float64(len(result.Candidates)) / float64(usersCount)
	}

	return domain.RunResult{
		RunKind:         domain.RunKindSearch,
		AlgorithmName:   result.AlgorithmName,
		ExecutionTimeMs: result.ExecutionTimeMs,
		Pairs:           nil,
		AvgScore:        stats.Avg,
		Analytics: domain.RunAnalytics{
			UsersCount:        usersCount,
			EligibleEdges:     0,
			UnmatchedUsers:    unmatchedUsers,
			PairsFound:        len(result.Candidates), // тут это количество найденных кандидатов
			CoverageRatio:     coverageRatio,
			BestScore:         stats.Best,
			WorstScore:        stats.Worst,
			AvgScore:          stats.Avg,
			MedianScore:       stats.Median,
			SumScore:          stats.Sum,
			ScoreStdDev:       stats.StdDev,
			PreparationTimeMs: 0,
			MatchingTimeMs:    result.ExecutionTimeMs,
			ScoringTimeMs:     result.ExecutionTimeMs,
			ScoreCalls:        scoreCalls,
		},
	}
}

type candidateStats struct {
	Best   float64
	Worst  float64
	Avg    float64
	Median float64
	Sum    float64
	StdDev float64
}

func calcCandidateStats(candidates []domain.CandidateResult) candidateStats {
	if len(candidates) == 0 {
		return candidateStats{}
	}

	scores := make([]float64, 0, len(candidates))
	best := candidates[0].Score
	worst := candidates[0].Score
	var sum float64

	for _, c := range candidates {
		s := c.Score
		scores = append(scores, s)
		sum += s

		if s > best {
			best = s
		}
		if s < worst {
			worst = s
		}
	}

	avg := sum / float64(len(scores))

	sort.Float64s(scores)

	var median float64
	n := len(scores)
	if n%2 == 0 {
		median = (scores[n/2-1] + scores[n/2]) / 2
	} else {
		median = scores[n/2]
	}

	var variance float64
	for _, s := range scores {
		diff := s - avg
		variance += diff * diff
	}
	variance /= float64(len(scores))

	return candidateStats{
		Best:   best,
		Worst:  worst,
		Avg:    avg,
		Median: median,
		Sum:    sum,
		StdDev: math.Sqrt(variance),
	}
}
