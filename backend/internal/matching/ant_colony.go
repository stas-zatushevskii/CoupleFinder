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
	scorer      *Scorer
	iterations  int
	ants        int
	alpha       float64
	beta        float64
	evaporation float64
	q           float64
}

func NewAntColony(scorer *Scorer) *AntColony {
	return &AntColony{
		scorer:      scorer,
		iterations:  30,
		ants:        10,
		alpha:       1.0,
		beta:        2.0,
		evaporation: 0.3,
		q:           1.0,
	}
}

func (a *AntColony) Name() string {
	return "ant_colony"
}

func (a *AntColony) Run(ctx context.Context, users []domain.User) (domain.RunResult, error) {
	start := time.Now()
	rnd := rand.New(rand.NewSource(time.Now().UnixNano()))

	if len(users) == 0 {
		return domain.RunResult{
			AlgorithmName:   a.Name(),
			ExecutionTimeMs: 0,
			Pairs:           nil,
			AvgScore:        0,
		}, nil
	}

	weights := make(map[edge]float64)
	pheromones := make(map[edge]float64)

	// Строим граф допустимых пар.
	for i := 0; i < len(users); i++ {
		for j := i + 1; j < len(users); j++ {
			scoreAB := a.scorer.Score(users[i], users[j])
			scoreBA := a.scorer.Score(users[j], users[i])
			weight := (scoreAB + scoreBA) / 2

			if weight <= 0 {
				continue
			}

			e := normalizeEdge(users[i].ID, users[j].ID)
			weights[e] = weight
			pheromones[e] = 1.0
		}
	}

	bestPairs := make([]domain.Pair, 0)
	bestScoreSum := -1.0

	for iter := 0; iter < a.iterations; iter++ {
		select {
		case <-ctx.Done():
			return domain.RunResult{}, ctx.Err()
		default:
		}

		iterBestPairs := make([]domain.Pair, 0)
		iterBestScoreSum := -1.0

		for ant := 0; ant < a.ants; ant++ {
			pairs := buildAntSolution(weights, pheromones, a.alpha, a.beta, rnd)
			scoreSum := sumPairs(pairs)

			if scoreSum > iterBestScoreSum {
				iterBestScoreSum = scoreSum
				iterBestPairs = pairs
			}
		}

		evaporate(pheromones, a.evaporation)
		deposit(pheromones, iterBestPairs, a.q)

		if iterBestScoreSum > bestScoreSum {
			bestScoreSum = iterBestScoreSum
			bestPairs = iterBestPairs
		}
	}

	return domain.RunResult{
		AlgorithmName:   a.Name(),
		ExecutionTimeMs: time.Since(start).Milliseconds(),
		Pairs:           bestPairs,
		AvgScore:        averageScore(bestPairs),
	}, nil
}

func buildAntSolution(
	weights map[edge]float64,
	pheromones map[edge]float64,
	alpha, beta float64,
	rnd *rand.Rand,
) []domain.Pair {
	used := make(map[int64]bool)
	pairs := make([]domain.Pair, 0)

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
		chosen := candidates[chosenIdx]

		pairs = append(pairs, domain.Pair{
			UserAID: chosen.U,
			UserBID: chosen.V,
			Score:   weights[chosen],
		})

		used[chosen.U] = true
		used[chosen.V] = true
	}

	return pairs
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
