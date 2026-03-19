package matching

import (
	"context"
	"time"

	"backend/internal/domain"
)

type CollaborativeFiltering struct {
	scorer *Scorer
	topK   int
}

func NewCollaborativeFiltering(scorer *Scorer) *CollaborativeFiltering {
	return &CollaborativeFiltering{
		scorer: scorer,
		topK:   5,
	}
}

func (a *CollaborativeFiltering) Name() string {
	return "collaborative_filtering"
}

func (a *CollaborativeFiltering) Run(ctx context.Context, users []domain.User) (domain.RunResult, error) {
	start := time.Now()

	if len(users) == 0 {
		return domain.RunResult{
			AlgorithmName:   a.Name(),
			ExecutionTimeMs: 0,
			Pairs:           nil,
			AvgScore:        0,
		}, nil
	}

	prefs := buildPreferenceLists(users, a.scorer)
	userMap := usersToMap(users)

	used := make(map[int64]bool, len(users))
	pairs := make([]domain.Pair, 0, len(users)/2)

	for _, user := range users {
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
				continue
			}

			// Упрощенная логика CF для вашей задачи:
			// формируем пару только если пользователи попали друг другу в top-K.
			if !isMutualTopK(user.ID, candidateID, prefs, a.topK) {
				continue
			}

			candidate, ok := userMap[candidateID]
			if !ok {
				continue
			}

			scoreAB := a.scorer.Score(user, candidate)
			scoreBA := a.scorer.Score(candidate, user)
			finalScore := (scoreAB + scoreBA) / 2

			if finalScore <= 0 {
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

	return domain.RunResult{
		AlgorithmName:   a.Name(),
		ExecutionTimeMs: time.Since(start).Milliseconds(),
		Pairs:           pairs,
		AvgScore:        averageScore(pairs),
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
