package matching

import (
	"context"
	"time"

	"backend/internal/domain"
)

type GaleShapley struct {
	scorer *Scorer
}

func NewGaleShapley(scorer *Scorer) *GaleShapley {
	return &GaleShapley{scorer: scorer}
}

func (g *GaleShapley) Name() string {
	return "gale_shapley"
}

func (g *GaleShapley) Run(ctx context.Context, users []domain.User) (domain.RunResult, error) {
	start := time.Now()

	if len(users) == 0 {
		return domain.RunResult{
			AlgorithmName:   g.Name(),
			ExecutionTimeMs: 0,
			Pairs:           nil,
			AvgScore:        0,
		}, nil
	}

	prefs := buildPreferenceLists(users, g.scorer)
	userMap := usersToMap(users)

	// Очередь свободных пользователей.
	free := make([]int64, 0, len(users))
	// Индекс следующего кандидата, которому пользователь будет делать "предложение".
	nextProposalIdx := make(map[int64]int, len(users))
	// Текущая пара пользователя: matchOf[userID] = partnerID, 0 если пары нет.
	matchOf := make(map[int64]int64, len(users))

	for _, u := range users {
		free = append(free, u.ID)
		nextProposalIdx[u.ID] = 0
		matchOf[u.ID] = 0
	}

	rank := buildRankMap(prefs)

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

		currentPartner := matchOf[vID]

		// Если v свободен — создаем пару.
		if currentPartner == 0 {
			matchOf[uID] = vID
			matchOf[vID] = uID
			continue
		}

		// Если v предпочитает нового кандидата текущему — перевыбор.
		if prefers(rank, vID, uID, currentPartner) {
			matchOf[uID] = vID
			matchOf[vID] = uID

			matchOf[currentPartner] = 0
			free = append(free, currentPartner)
			continue
		}

		// Иначе u остается свободным и попробует следующего кандидата.
		free = append(free, uID)
	}

	seen := make(map[int64]bool, len(users))
	pairs := make([]domain.Pair, 0, len(users)/2)

	for _, u := range users {
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

		scoreAB := g.scorer.Score(u, partner)
		scoreBA := g.scorer.Score(partner, u)
		finalScore := (scoreAB + scoreBA) / 2

		if finalScore <= 0 {
			continue
		}

		pairs = append(pairs, domain.Pair{
			UserAID: u.ID,
			UserBID: partnerID,
			Score:   finalScore,
		})

		seen[u.ID] = true
		seen[partnerID] = true
	}

	return domain.RunResult{
		AlgorithmName:   g.Name(),
		ExecutionTimeMs: time.Since(start).Milliseconds(),
		Pairs:           pairs,
		AvgScore:        averageScore(pairs),
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
