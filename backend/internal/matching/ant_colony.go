package matching

import (
	"context"
	"math"
	"math/rand"
	"time"

	"backend/internal/domain"
)

type edge struct {
	U int64
	V int64
}

type AntColony struct {
	scorer       *Scorer
	iterations   int
	ants         int
	alpha        float64
	beta         float64
	evaporation  float64
	q            float64
	minEdgeScore float64
}

func NewAntColony(scorer *Scorer) *AntColony {
	return &AntColony{
		scorer:       scorer,
		iterations:   400,
		ants:         120,
		alpha:        1.4,
		beta:         4.0,
		evaporation:  0.18,
		q:            2.5,
		minEdgeScore: 0.03,
	}
}

func (a *AntColony) Name() string {
	return "ant_colony"
}

func (a *AntColony) Run(ctx context.Context, users []domain.User) (domain.RunResult, error) {
	start := time.Now()
	rnd := rand.New(rand.NewSource(time.Now().UnixNano()))

	analytics := domain.RunAnalytics{
		UsersCount:           len(users),
		Iterations:           a.iterations,
		Ants:                 a.ants,
		BestIteration:        -1,
		ConvergenceIteration: -1,
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

	userMap := usersToMap(users)

	preparationStart := time.Now()

	weights := make(map[edge]float64)
	pheromones := make(map[edge]float64)

	for i := 0; i < len(users); i++ {
		for j := i + 1; j < len(users); j++ {
			scoreStart := time.Now()
			weight := a.scorer.FinalPairScore(users[i], users[j])
			analytics.ScoringTimeMs += time.Since(scoreStart).Milliseconds()
			analytics.ScoreCalls += 2

			if weight < a.minEdgeScore {
				continue
			}

			e := normalizeEdge(users[i].ID, users[j].ID)
			weights[e] = weight
			pheromones[e] = 1.0
		}
	}

	analytics.EligibleEdges = len(weights)
	analytics.PreparationTimeMs = time.Since(preparationStart).Milliseconds()

	matchingStart := time.Now()

	bestPairs := make([]domain.Pair, 0)
	bestScoreSum := -1.0
	lastImprovementIter := -1

	for iter := 0; iter < a.iterations; iter++ {
		select {
		case <-ctx.Done():
			return domain.RunResult{}, ctx.Err()
		default:
		}

		iterBestPairs := make([]domain.Pair, 0)
		iterBestScoreSum := -1.0

		for ant := 0; ant < a.ants; ant++ {
			pairs, rouletteCalls := buildAntSolution(weights, pheromones, a.alpha, a.beta, rnd)
			analytics.RouletteCalls += rouletteCalls
			analytics.SolutionsBuilt++

			scoreSum := sumPairs(pairs)
			if scoreSum > iterBestScoreSum {
				iterBestScoreSum = scoreSum
				iterBestPairs = pairs
			}
		}

		evaporate(pheromones, a.evaporation)
		analytics.PheromoneUpdates += int64(len(pheromones))

		deposit(pheromones, iterBestPairs, a.q)
		analytics.PheromoneUpdates += int64(len(iterBestPairs))

		if iterBestScoreSum > bestScoreSum {
			bestScoreSum = iterBestScoreSum
			bestPairs = clonePairs(iterBestPairs)
			analytics.BestIteration = iter
			lastImprovementIter = iter
		}
	}

	analytics.MatchingTimeMs = time.Since(matchingStart).Milliseconds()

	if lastImprovementIter >= 0 {
		analytics.ConvergenceIteration = lastImprovementIter
	}

	finalPairs := make([]domain.Pair, 0, len(bestPairs))
	finalScoringStart := time.Now()

	for _, p := range bestPairs {
		u, okU := userMap[p.UserAID]
		v, okV := userMap[p.UserBID]
		if !okU || !okV {
			continue
		}

		score := a.scorer.FinalPairScore(u, v)
		analytics.ScoreCalls += 2

		if score <= 0 {
			continue
		}

		finalPairs = append(finalPairs, domain.Pair{
			UserAID: p.UserAID,
			UserBID: p.UserBID,
			Score:   score,
		})
	}

	analytics.ScoringTimeMs += time.Since(finalScoringStart).Milliseconds()

	analytics.PairsFound = len(finalPairs)
	analytics.UnmatchedUsers = len(users) - len(finalPairs)*2
	analytics.CoverageRatio = calcCoverageRatio(len(users), len(finalPairs))

	scoreStats := calcPairStats(finalPairs)
	analytics.BestScore = scoreStats.Best
	analytics.WorstScore = scoreStats.Worst
	analytics.AvgScore = scoreStats.Avg
	analytics.MedianScore = scoreStats.Median
	analytics.SumScore = scoreStats.Sum
	analytics.ScoreStdDev = scoreStats.StdDev

	return domain.RunResult{
		AlgorithmName:   a.Name(),
		ExecutionTimeMs: time.Since(start).Milliseconds(),
		Pairs:           finalPairs,
		AvgScore:        analytics.AvgScore,
		Analytics:       analytics,
	}, nil
}

func buildAntSolution(
	weights map[edge]float64,
	pheromones map[edge]float64,
	alpha, beta float64,
	rnd *rand.Rand,
) ([]domain.Pair, int64) {
	used := make(map[int64]bool)
	pairs := make([]domain.Pair, 0)
	var rouletteCalls int64

	for {
		candidates := make([]edge, 0)
		probabilities := make([]float64, 0)

		for e, w := range weights {
			if used[e.U] || used[e.V] {
				continue
			}

			tau := math.Pow(pheromones[e], alpha)
			eta := math.Pow(w, beta)
			p := tau * eta
			if p <= 0 {
				continue
			}

			candidates = append(candidates, e)
			probabilities = append(probabilities, p)
		}

		if len(candidates) == 0 {
			break
		}

		chosenIdx := roulette(probabilities, rnd)
		rouletteCalls++

		chosen := candidates[chosenIdx]
		pairs = append(pairs, domain.Pair{
			UserAID: chosen.U,
			UserBID: chosen.V,
			Score:   weights[chosen],
		})

		used[chosen.U] = true
		used[chosen.V] = true
	}

	return pairs, rouletteCalls
}

func roulette(weights []float64, rnd *rand.Rand) int {
	var total float64
	for _, w := range weights {
		total += w
	}

	if total <= 0 {
		return 0
	}

	r := rnd.Float64() * total
	var cumulative float64
	for i, w := range weights {
		cumulative += w
		if r <= cumulative {
			return i
		}
	}

	return len(weights) - 1
}

func evaporate(pheromones map[edge]float64, evaporation float64) {
	for e, ph := range pheromones {
		newVal := ph * (1 - evaporation)
		if newVal < 0.01 {
			newVal = 0.01
		}
		pheromones[e] = newVal
	}
}

func deposit(pheromones map[edge]float64, pairs []domain.Pair, q float64) {
	for _, p := range pairs {
		e := normalizeEdge(p.UserAID, p.UserBID)
		pheromones[e] += q * p.Score
	}
}

func sumPairs(pairs []domain.Pair) float64 {
	var sum float64
	for _, p := range pairs {
		sum += p.Score
	}
	return sum
}

func normalizeEdge(a, b int64) edge {
	if a < b {
		return edge{U: a, V: b}
	}
	return edge{U: b, V: a}
}

func clonePairs(in []domain.Pair) []domain.Pair {
	out := make([]domain.Pair, len(in))
	copy(out, in)
	return out
}
