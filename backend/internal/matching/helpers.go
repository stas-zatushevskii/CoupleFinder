package matching

import (
	"math"
	"sort"

	"backend/internal/domain"
)

type scoredCandidate struct {
	id    int64
	score float64
}

func buildPreferenceListsLimited(
	fromUsers []domain.User,
	toUsers []domain.User,
	scoreFn func(a, b domain.User) float64,
	limit int,
	minScore float64,
	analytics *domain.RunAnalytics,
) map[int64][]int64 {
	prefs := make(map[int64][]int64, len(fromUsers))

	for _, u := range fromUsers {
		candidates := make([]scoredCandidate, 0, len(toUsers))

		for _, v := range toUsers {
			if u.ID == v.ID {
				continue
			}

			score := scoreFn(u, v)
			analytics.ScoreCalls++

			if score < minScore {
				continue
			}

			candidates = append(candidates, scoredCandidate{
				id:    v.ID,
				score: score,
			})
		}

		sort.Slice(candidates, func(i, j int) bool {
			if candidates[i].score == candidates[j].score {
				return candidates[i].id < candidates[j].id
			}
			return candidates[i].score > candidates[j].score
		})

		if limit > 0 && len(candidates) > limit {
			candidates = candidates[:limit]
		}

		ids := make([]int64, 0, len(candidates))
		for _, c := range candidates {
			ids = append(ids, c.id)
		}

		prefs[u.ID] = ids
	}

	return prefs
}

func sortUsersByBestCandidate(users []domain.User, prefs map[int64][]int64) []domain.User {
	out := append([]domain.User(nil), users...)

	sort.Slice(out, func(i, j int) bool {
		li := len(prefs[out[i].ID])
		lj := len(prefs[out[j].ID])

		if li == 0 && lj == 0 {
			return out[i].ID < out[j].ID
		}
		if li == 0 {
			return false
		}
		if lj == 0 {
			return true
		}
		if li == lj {
			return out[i].ID < out[j].ID
		}

		return li < lj
	})

	return out
}

func mergePrefs(parts ...map[int64][]int64) map[int64][]int64 {
	res := make(map[int64][]int64)
	for _, p := range parts {
		for k, v := range p {
			res[k] = v
		}
	}
	return res
}

func usersToMap(users []domain.User) map[int64]domain.User {
	out := make(map[int64]domain.User, len(users))
	for _, u := range users {
		out[u.ID] = u
	}
	return out
}

func splitUsersForStableMatching(users []domain.User) ([]domain.User, []domain.User) {
	sortedUsers := append([]domain.User(nil), users...)
	sort.Slice(sortedUsers, func(i, j int) bool {
		return sortedUsers[i].ID < sortedUsers[j].ID
	})

	left := make([]domain.User, 0, (len(sortedUsers)+1)/2)
	right := make([]domain.User, 0, len(sortedUsers)/2)

	for i, u := range sortedUsers {
		if i%2 == 0 {
			left = append(left, u)
		} else {
			right = append(right, u)
		}
	}

	return left, right
}

func calcCoverageRatio(usersCount, pairsFound int) float64 {
	if usersCount == 0 {
		return 0
	}
	return float64(pairsFound*2) / float64(usersCount)
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

	return pairStats{
		Best:   best,
		Worst:  worst,
		Avg:    avg,
		Median: median,
		Sum:    sum,
		StdDev: math.Sqrt(variance),
	}
}

func harmonicMean(a, b float64) float64 {
	if a <= 0 || b <= 0 {
		return 0
	}
	return 2 * a * b / (a + b)
}
