package matching

import (
	"sort"

	"backend/internal/domain"
)

func averageScore(pairs []domain.Pair) float64 {
	if len(pairs) == 0 {
		return 0
	}

	var sum float64
	for _, p := range pairs {
		sum += p.Score
	}
	return sum / float64(len(pairs))
}

func buildPreferenceLists(users []domain.User, scorer *Scorer) map[int64][]int64 {
	result := make(map[int64][]int64, len(users))

	for _, u := range users {
		type candidateScore struct {
			ID    int64
			Score float64
		}

		candidates := make([]candidateScore, 0, len(users)-1)

		for _, c := range users {
			if u.ID == c.ID {
				continue
			}

			score := scorer.Score(u, c)
			if score <= 0 {
				continue
			}

			candidates = append(candidates, candidateScore{
				ID:    c.ID,
				Score: score,
			})
		}

		sort.Slice(candidates, func(i, j int) bool {
			return candidates[i].Score > candidates[j].Score
		})

		result[u.ID] = make([]int64, 0, len(candidates))
		for _, c := range candidates {
			result[u.ID] = append(result[u.ID], c.ID)
		}
	}

	return result
}

func usersToMap(users []domain.User) map[int64]domain.User {
	out := make(map[int64]domain.User, len(users))
	for _, u := range users {
		out[u.ID] = u
	}
	return out
}
