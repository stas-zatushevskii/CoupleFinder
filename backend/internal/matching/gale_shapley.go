package matching

import (
	"context"
	"time"

	"backend/internal/domain"
)

type GaleShapley struct {
	scorer            *Scorer
	shortlistPerUser  int
	minCandidateScore float64
}

func NewGaleShapley(scorer *Scorer) *GaleShapley {
	return &GaleShapley{
		scorer:            scorer,
		shortlistPerUser:  6,
		minCandidateScore: 0.20,
	}
}

func (g *GaleShapley) Name() string {
	return "gale_shapley"
}

func (g *GaleShapley) Run(ctx context.Context, users []domain.User) (domain.RunResult, error) {
	start := time.Now()

	analytics := domain.RunAnalytics{
		UsersCount: len(users),
	}

	if len(users) == 0 {
		return domain.RunResult{
			AlgorithmName:   g.Name(),
			ExecutionTimeMs: 0,
			Pairs:           nil,
			AvgScore:        0,
			Analytics:       analytics,
		}, nil
	}

	preparationStart := time.Now()

	left, right := splitUsersForStableMatching(users)

	prefsLeft := buildPreferenceListsLimited(
		left,
		right,
		g.scorer.StableScore,
		g.shortlistPerUser,
		g.minCandidateScore,
		&analytics,
	)
	prefsRight := buildPreferenceListsLimited(
		right,
		left,
		g.scorer.StableScore,
		g.shortlistPerUser,
		g.minCandidateScore,
		&analytics,
	)

	prefs := mergePrefs(prefsLeft, prefsRight)
	userMap := usersToMap(users)
	rank := buildRankMap(prefs)

	analytics.EligibleEdges = countEligibleEdgesFromPrefs(prefs)
	analytics.PreparationTimeMs = time.Since(preparationStart).Milliseconds()

	matchingStart := time.Now()

	free := make([]int64, 0, len(left))
	nextProposalIdx := make(map[int64]int, len(left))
	matchOf := make(map[int64]int64, len(users))

	for _, u := range left {
		free = append(free, u.ID)
		nextProposalIdx[u.ID] = 0
		matchOf[u.ID] = 0
	}
	for _, u := range right {
		matchOf[u.ID] = 0
	}

	for len(free) > 0 {
		select {
		case <-ctx.Done():
			return domain.RunResult{}, ctx.Err()
		default:
		}

		uID := free[0]
		free = free[1:]

		list := prefs[uID]
		if len(list) == 0 {
			continue
		}
		if nextProposalIdx[uID] >= len(list) {
			continue
		}

		vID := list[nextProposalIdx[uID]]
		nextProposalIdx[uID]++
		analytics.ProposalCount++

		currentPartner := matchOf[vID]

		if currentPartner == 0 {
			matchOf[uID] = vID
			matchOf[vID] = uID
			continue
		}

		if prefers(rank, vID, uID, currentPartner) {
			matchOf[uID] = vID
			matchOf[vID] = uID
			matchOf[currentPartner] = 0

			free = append(free, currentPartner)
			analytics.SwitchCount++
			continue
		}

		free = append(free, uID)
	}

	analytics.MatchingTimeMs = time.Since(matchingStart).Milliseconds()

	finalScoringStart := time.Now()

	seen := make(map[int64]bool, len(users))
	pairs := make([]domain.Pair, 0, len(left))

	for _, u := range left {
		partnerID := matchOf[u.ID]
		if partnerID == 0 {
			continue
		}
		if seen[u.ID] || seen[partnerID] {
			continue
		}

		partner, ok := userMap[partnerID]
		if !ok {
			continue
		}

		score := g.scorer.FinalPairScore(u, partner)
		analytics.ScoreCalls += 2
		if score <= 0 {
			continue
		}

		pairs = append(pairs, domain.Pair{
			UserAID: u.ID,
			UserBID: partnerID,
			Score:   score,
		})

		seen[u.ID] = true
		seen[partnerID] = true
	}

	analytics.ScoringTimeMs += time.Since(finalScoringStart).Milliseconds()

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
		AlgorithmName:   g.Name(),
		ExecutionTimeMs: time.Since(start).Milliseconds(),
		Pairs:           pairs,
		AvgScore:        analytics.AvgScore,
		Analytics:       analytics,
	}, nil
}

func buildRankMap(prefs map[int64][]int64) map[int64]map[int64]int {
	ranks := make(map[int64]map[int64]int, len(prefs))

	for userID, list := range prefs {
		ranks[userID] = make(map[int64]int, len(list))
		for i, candidateID := range list {
			ranks[userID][candidateID] = i
		}
	}

	return ranks
}

func prefers(rank map[int64]map[int64]int, chooserID, newID, currentID int64) bool {
	newRank, okNew := rank[chooserID][newID]
	currentRank, okCurrent := rank[chooserID][currentID]

	if !okNew {
		return false
	}
	if !okCurrent {
		return true
	}

	return newRank < currentRank
}
