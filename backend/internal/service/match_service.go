package service

import (
	"context"
	"fmt"
	"log"
	"math"
	"sort"
	"strings"
	"time"

	"backend/internal/domain"
	"backend/internal/matching"
	"backend/internal/repository"
)

type MatchService struct {
	userRepo repository.UserRepository
	runRepo  repository.RunRepository
	algs     map[string]domain.MatchingAlgorithm
	scorer   *matching.Scorer
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
		scorer:   matching.NewScorer(),
	}
}

// RunForUser подбирает пары для конкретного пользователя (id может быть 0 — тогда создаем времочного).
func (s *MatchService) RunForUser(ctx context.Context, algorithmName string, limit int, userID int64, userGender domain.Gender, filters domain.SearchFilters) (domain.RunResult, error) {
	if limit <= 0 {
		limit = 100
	}
	if _, ok := s.algs[algorithmName]; !ok {
		return domain.RunResult{}, fmt.Errorf("unknown algorithm: %s", algorithmName)
	}

	var seeker domain.User
	var err error

	if userID > 0 {
		seeker, err = s.userRepo.GetUserByID(ctx, userID)
		if err != nil {
			return domain.RunResult{}, err
		}
	} else {
		seeker = buildUserFromFilters(userGender, filters)
		newID, err := s.userRepo.CreateUser(ctx, seeker)
		if err != nil {
			return domain.RunResult{}, err
		}
		seeker.ID = newID
	}

	candidates, err := s.userRepo.ListUsersForMatching(ctx, limit*3, filters)
	if err != nil {
		return domain.RunResult{}, err
	}

	users := append([]domain.User{seeker}, candidates...)

	start := time.Now()
	pairs, scoreCalls := s.rankPairsForSeeker(algorithmName, seeker, candidates, limit)
	execMs := time.Since(start).Milliseconds()

	stats := calcPairStats(pairs)
	matchedUsers := len(pairs) + 1
	unmatchedUsers := len(users) - matchedUsers
	if unmatchedUsers < 0 {
		unmatchedUsers = 0
	}

	result := domain.RunResult{
		RunKind:         domain.RunKindMatch,
		AlgorithmName:   algorithmName,
		ExecutionTimeMs: execMs,
		Pairs:           pairs,
		AvgScore:        stats.Avg,
		SeekerID:        seeker.ID,
		Analytics: domain.RunAnalytics{
			UsersCount:           len(users),
			EligibleEdges:        len(candidates),
			UnmatchedUsers:       unmatchedUsers,
			PairsFound:           len(pairs),
			MatchingTimeMs:       execMs,
			ScoringTimeMs:        execMs,
			ScoreCalls:           scoreCalls,
			BestScore:            stats.Best,
			WorstScore:           stats.Worst,
			AvgScore:             stats.Avg,
			MedianScore:          stats.Median,
			SumScore:             stats.Sum,
			CoverageRatio:        float64(matchedUsers) / float64(len(users)),
			ScoreStdDev:          stats.StdDev,
			BestIteration:        -1,
			ConvergenceIteration: -1,
		},
	}

	if err := s.runRepo.SaveRunResult(ctx, result); err != nil {
		log.Println("save run record failed:", err)
		return domain.RunResult{}, err
	}

	return result, nil
}

func (s *MatchService) Run(ctx context.Context, algorithmName string, limit int, filters domain.SearchFilters) (domain.RunResult, error) {
	alg, ok := s.algs[algorithmName]
	if !ok {
		return domain.RunResult{}, fmt.Errorf("unknown algorithm: %s", algorithmName)
	}

	users, err := s.userRepo.ListUsersForMatching(ctx, limit, filters)
	if err != nil {
		return domain.RunResult{}, err
	}

	result, err := alg.Run(ctx, users)
	if err != nil {
		return domain.RunResult{}, err
	}

	if err := s.runRepo.SaveRunResult(ctx, result); err != nil {
		log.Println("save run record failed:", err)
		return domain.RunResult{}, err
	}

	return result, nil
}

func (s *MatchService) CompareAll(ctx context.Context, limit int) ([]domain.RunResult, error) {
	users, err := s.userRepo.ListUsersForMatching(ctx, limit, domain.SearchFilters{})
	if err != nil {
		return nil, err
	}

	results := make([]domain.RunResult, 0, len(s.algs))

	for _, alg := range s.algs {
		result, err := alg.Run(ctx, users)
		if err != nil {
			return nil, err
		}

		if err := s.runRepo.SaveRunResult(ctx, result); err != nil {
			log.Println("save run record failed:", err)
			return nil, err
		}

		results = append(results, result)
	}

	return results, nil
}

func (s *MatchService) GetRuns(ctx context.Context, algorithm string) ([]domain.AlgorithmRun, error) {
	return s.runRepo.GetRuns(ctx, algorithm, domain.RunKindMatch)
}

func (s *MatchService) rankPairsForSeeker(algorithmName string, seeker domain.User, candidates []domain.User, limit int) ([]domain.Pair, int64) {
	type scored struct {
		user  domain.User
		score float64
	}
	list := make([]scored, 0, len(candidates))
	var scoreCalls int64

	for _, c := range candidates {
		if c.ID == seeker.ID {
			continue
		}

		var score float64
		switch algorithmName {
		case "gale_shapley":
			score = s.scorer.StableScore(seeker, c)
			scoreCalls++
		case "collaborative_filtering":
			score = s.scorer.FastScore(seeker, c)
			scoreCalls++
		case "ant_colony":
			for i := 0; i < 3; i++ {
				score += s.scorer.FinalPairScore(seeker, c)
				scoreCalls += 2
			}
			score /= 3
		default:
			score = s.scorer.FinalPairScore(seeker, c)
			scoreCalls += 2
		}

		if score <= 0 {
			continue
		}
		list = append(list, scored{user: c, score: score})
	}

	sort.Slice(list, func(i, j int) bool { return list[i].score > list[j].score })
	if len(list) > limit {
		list = list[:limit]
	}

	pairs := make([]domain.Pair, 0, len(list))
	for _, item := range list {
		pairs = append(pairs, domain.Pair{
			UserAID: seeker.ID,
			UserBID: item.user.ID,
			Score:   item.score,
		})
	}
	return pairs, scoreCalls
}

func buildUserFromFilters(g domain.Gender, f domain.SearchFilters) domain.User {
	name := fmt.Sprintf("manual_%d", time.Now().UnixNano())
	age := f.AgeFrom
	if age == 0 {
		age = 25
	}
	return domain.User{
		Name:             name,
		Gender:           g,
		Age:              age,
		City:             strings.ToLower(f.City),
		RelationshipGoal: f.RelationshipGoal,
		Lifestyle:        f.Lifestyle,
		BadHabits:        f.BadHabits,
		Interests:        f.Interests,
		Preferences: domain.Preferences{
			PreferredGender:    f.Gender,
			AgeFrom:            f.AgeFrom,
			AgeTo:              f.AgeTo,
			PreferredCity:      strings.ToLower(f.City),
			PreferredGoal:      f.RelationshipGoal,
			PreferredLifestyle: f.Lifestyle,
			PreferredBadHabits: f.BadHabits,
		},
		Bio: "temporary user",
	}
}

type pairStats struct {
	Best   float64
	Worst  float64
	Avg    float64
	Median float64
	Sum    float64
	StdDev float64
}

func calcPairStats(pairs []domain.Pair) pairStats {
	if len(pairs) == 0 {
		return pairStats{}
	}

	scores := make([]float64, 0, len(pairs))
	best := pairs[0].Score
	worst := pairs[0].Score
	var sum float64

	for _, p := range pairs {
		s := p.Score
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

	sorted := append([]float64(nil), scores...)
	sort.Float64s(sorted)

	var median float64
	n := len(sorted)
	if n%2 == 0 {
		median = (sorted[n/2-1] + sorted[n/2]) / 2
	} else {
		median = sorted[n/2]
	}

	var variance float64
	for _, s := range scores {
		diff := s - avg
		variance += diff * diff
	}
	variance /= float64(len(scores))

	return pairStats{
		Best:   best,
		Worst:  worst,
		Avg:    avg,
		Median: median,
		Sum:    sum,
		StdDev: math.Sqrt(variance),
	}
}

func calcCoverageRatio(usersCount, pairsFound int) float64 {
	if usersCount == 0 {
		return 0
	}
	return float64(pairsFound*2) / float64(usersCount)
}
