package matching

import (
	"context"
	"time"

	"backend/internal/domain"
)

type CollaborativeFiltering struct {
	scorer            *Scorer
	topK              int
	shortlistPerUser  int
	minCandidateScore float64
}

func NewCollaborativeFiltering(scorer *Scorer) *CollaborativeFiltering {
	return &CollaborativeFiltering{
		scorer:            scorer,
		topK:              1,
		shortlistPerUser:  2,
		minCandidateScore: 0.55,
	}
}

func (a *CollaborativeFiltering) Name() string {
	return "collaborative_filtering"
}

func (a *CollaborativeFiltering) Run(ctx context.Context, users []domain.User) (domain.RunResult, error) {
	start := time.Now()

	analytics := domain.RunAnalytics{
		UsersCount: len(users),
	}

	if len(users) == 0 {
		return domain.RunResult{
			AlgorithmName:   a.Name(),
			ExecutionTimeMs: 0,
			Pairs:           nil,
			AvgScore:        0,
			Analytics:       analytics,
		}, nil
	}

	preparationStart := time.Now()

	prefs := buildPreferenceListsLimited(
		users,
		users,
		a.scorer.FastScore,
		a.shortlistPerUser,
		a.minCandidateScore,
		&analytics,
	)
	userMap := usersToMap(users)

	analytics.EligibleEdges = countEligibleEdgesFromPrefs(prefs)
	analytics.PreparationTimeMs = time.Since(preparationStart).Milliseconds()

	matchingStart := time.Now()

	used := make(map[int64]bool, len(users))
	pairs := make([]domain.Pair, 0, len(users)/2)
	orderedUsers := sortUsersByBestCandidate(users, prefs)

	for _, user := range orderedUsers {
		select {
		case <-ctx.Done():
			return domain.RunResult{}, ctx.Err()
		default:
		}

		if used[user.ID] {
			continue
		}

		candidates := prefs[user.ID]
		if len(candidates) == 0 {
			continue
		}

		for _, candidateID := range candidates {
			if used[candidateID] {
				analytics.RejectedCandidates++
				continue
			}

			analytics.MutualTopKChecks++
			if !isMutualTopK(user.ID, candidateID, prefs, a.topK) {
				analytics.RejectedCandidates++
				continue
			}

			candidate, ok := userMap[candidateID]
			if !ok {
				analytics.RejectedCandidates++
				continue
			}

			scoreStart := time.Now()
			finalScore := a.scorer.FinalPairScore(user, candidate)
			analytics.ScoringTimeMs += time.Since(scoreStart).Milliseconds()
			analytics.ScoreCalls += 2

			if finalScore <= 0 {
				analytics.RejectedCandidates++
				continue
			}

			pairs = append(pairs, domain.Pair{
				UserAID: user.ID,
				UserBID: candidateID,
				Score:   finalScore,
			})

			used[user.ID] = true
			used[candidateID] = true
			break
		}
	}

	analytics.MatchingTimeMs = time.Since(matchingStart).Milliseconds()

	analytics.PairsFound = len(pairs)
	analytics.UnmatchedUsers = len(users) - len(pairs)*2
	analytics.CoverageRatio = calcCoverageRatio(len(users), len(pairs))

	scoreStats := calcPairStats(pairs)
	analytics.BestScore = scoreStats.Best
	analytics.WorstScore = scoreStats.Worst
	analytics.AvgScore = scoreStats.Avg
	analytics.MedianScore = scoreStats.Median
	analytics.SumScore = scoreStats.Sum
	analytics.ScoreStdDev = scoreStats.StdDev

	return domain.RunResult{
		AlgorithmName:   a.Name(),
		ExecutionTimeMs: time.Since(start).Milliseconds(),
		Pairs:           pairs,
		AvgScore:        analytics.AvgScore,
		Analytics:       analytics,
	}, nil
}

func isMutualTopK(aID, bID int64, prefs map[int64][]int64, k int) bool {
	return containsTopK(prefs[aID], bID, k) && containsTopK(prefs[bID], aID, k)
}

func containsTopK(list []int64, target int64, k int) bool {
	if k > len(list) {
		k = len(list)
	}

	for i := 0; i < k; i++ {
		if list[i] == target {
			return true
		}
	}

	return false
}

func countEligibleEdgesFromPrefs(prefs map[int64][]int64) int {
	seen := make(map[[2]int64]struct{})

	for userID, candidates := range prefs {
		for _, candidateID := range candidates {
			key := normalizedPairKey(userID, candidateID)
			seen[key] = struct{}{}
		}
	}

	return len(seen)
}

func normalizedPairKey(a, b int64) [2]int64 {
	if a < b {
		return [2]int64{a, b}
	}
	return [2]int64{b, a}
}
