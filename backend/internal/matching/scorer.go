package matching

import (
	"math"
	"strings"

	"backend/internal/domain"
)

type Scorer struct{}

func NewScorer() *Scorer {
	return &Scorer{}
}

// ------------------------------------------------------------
// FINAL / PRECISE SCORE
// ------------------------------------------------------------

func (s *Scorer) Score(a, b domain.User) float64 {
	base := calcBasePreferenceScore(a.Preferences, a.Interests, b)
	if base <= 0.01 {
		return 0
	}

	penalty := calcPreferencePenalty(a.Preferences, b)
	contrasted := amplify(base)

	return clamp01(contrasted * penalty)
}

func (s *Scorer) FinalPairScore(a, b domain.User) float64 {
	scoreAB := s.Score(a, b)
	scoreBA := s.Score(b, a)
	return harmonicMean(scoreAB, scoreBA)
}

// ------------------------------------------------------------
// FAST SCORE FOR COLLABORATIVE FILTERING
// Быстрый и грубый: специально делаем его проще,
// чтобы CF был быстрым и локальным.
// ------------------------------------------------------------

func (s *Scorer) FastScore(a, b domain.User) float64 {
	if a.ID == b.ID {
		return 0
	}

	if a.Preferences.PreferredGender != "" && a.Preferences.PreferredGender != b.Gender {
		return 0
	}

	if !roughAgeMatch(a.Preferences.AgeFrom, a.Preferences.AgeTo, b.Age, 3) {
		return 0
	}

	interests := calcInterestsScoreV2(a.Interests, b.Interests)
	goal := calcGoalScoreV2(a.Preferences.PreferredGoal, b.RelationshipGoal)
	city := calcSoftCityScore(a.Preferences.PreferredCity, b.City)

	// Намеренно простой и быстрый score.
	score := 0.60*interests + 0.30*goal + 0.10*city
	return clamp01(score)
}

// ------------------------------------------------------------
// STABLE SCORE FOR GALE-SHAPLEY
// Специально делаем другой акцент: стабильность предпочтений,
// а не абсолютный максимум общего score.
// ------------------------------------------------------------

func (s *Scorer) StableScore(a, b domain.User) float64 {
	if a.ID == b.ID {
		return 0
	}

	if a.Preferences.PreferredGender != "" && a.Preferences.PreferredGender != b.Gender {
		return 0
	}

	if !roughAgeMatch(a.Preferences.AgeFrom, a.Preferences.AgeTo, b.Age, 5) {
		return 0
	}

	age := calcSoftAgeScore(a.Preferences.AgeFrom, a.Preferences.AgeTo, b.Age)
	goal := calcGoalScoreV2(a.Preferences.PreferredGoal, b.RelationshipGoal)
	lifestyle := calcLifestyleScoreV2(a.Preferences.PreferredLifestyle, b.Lifestyle)
	interests := calcInterestsScoreV2(a.Interests, b.Interests)

	// Упор на цели и возраст, чтобы preference list был более "стабильным".
	score := 0.35*goal + 0.30*age + 0.20*lifestyle + 0.15*interests
	return clamp01(score)
}

func roughAgeMatch(ageFrom, ageTo, age, tolerance int) bool {
	if ageFrom == 0 && ageTo == 0 {
		return true
	}

	if ageTo != 0 && ageFrom > ageTo {
		ageFrom, ageTo = ageTo, ageFrom
	}

	if ageFrom != 0 && age < ageFrom-tolerance {
		return false
	}
	if ageTo != 0 && age > ageTo+tolerance {
		return false
	}

	return true
}

// ------------------------------------------------------------
// Search score
// ------------------------------------------------------------

func (s *Scorer) ScoreBySearch(filters domain.SearchFilters, candidate domain.User) float64 {
	base := calcBaseSearchScore(filters, candidate)
	if base <= 0.01 {
		return 0
	}

	penalty := calcSearchPenalty(filters, candidate)
	score := amplify(base) * penalty

	return clamp01(score)
}

// ------------------------------------------------------------
// Base score
// ------------------------------------------------------------

func calcBasePreferenceScore(pref domain.Preferences, interests []string, candidate domain.User) float64 {
	interestsScore := calcInterestsScoreV2(interests, candidate.Interests)
	ageScore := calcSoftAgeScore(pref.AgeFrom, pref.AgeTo, candidate.Age)
	cityScore := calcSoftCityScore(pref.PreferredCity, candidate.City)
	goalScore := calcGoalScoreV2(pref.PreferredGoal, candidate.RelationshipGoal)
	lifestyleScore := calcLifestyleScoreV2(pref.PreferredLifestyle, candidate.Lifestyle)
	habitsScore := calcBadHabitsScoreV2(pref.PreferredBadHabits, candidate.BadHabits)

	score := 0.45*interestsScore +
		0.18*ageScore +
		0.12*cityScore +
		0.13*goalScore +
		0.07*lifestyleScore +
		0.05*habitsScore

	return clamp01(score)
}

func calcBaseSearchScore(filters domain.SearchFilters, candidate domain.User) float64 {
	interestsScore := calcInterestsScoreV2(filters.Interests, candidate.Interests)
	ageScore := calcSoftAgeScore(filters.AgeFrom, filters.AgeTo, candidate.Age)
	cityScore := calcSoftCityScore(filters.City, candidate.City)
	goalScore := calcGoalScoreV2(filters.RelationshipGoal, candidate.RelationshipGoal)
	lifestyleScore := calcLifestyleScoreV2(filters.Lifestyle, candidate.Lifestyle)
	habitsScore := calcSearchBadHabitsScoreV2(filters.BadHabits, candidate.BadHabits)

	score := 0.45*interestsScore +
		0.18*ageScore +
		0.12*cityScore +
		0.13*goalScore +
		0.07*lifestyleScore +
		0.05*habitsScore

	return clamp01(score)
}

func calcPreferencePenalty(pref domain.Preferences, candidate domain.User) float64 {
	penalty := 1.0

	if pref.PreferredGender != "" && pref.PreferredGender != candidate.Gender {
		penalty *= 0.10
	}

	if pref.PreferredCity != "" && !strings.EqualFold(pref.PreferredCity, candidate.City) {
		penalty *= 0.55
	}

	if pref.AgeFrom > 0 || pref.AgeTo > 0 {
		if candidate.Age < pref.AgeFrom || candidate.Age > pref.AgeTo {
			penalty *= 0.35
		}
	}

	return penalty
}

func calcSearchPenalty(filters domain.SearchFilters, candidate domain.User) float64 {
	penalty := 1.0

	if filters.Gender != "" && filters.Gender != candidate.Gender {
		penalty *= 0.10
	}

	if filters.City != "" && !strings.EqualFold(filters.City, candidate.City) {
		penalty *= 0.55
	}

	if filters.AgeFrom > 0 || filters.AgeTo > 0 {
		if candidate.Age < filters.AgeFrom || candidate.Age > filters.AgeTo {
			penalty *= 0.35
		}
	}

	return penalty
}

func amplify(v float64) float64 {
	return math.Pow(clamp01(v), 1.8)
}

func calcInterestsScoreV2(a, b []string) float64 {
	if len(a) == 0 || len(b) == 0 {
		return 0
	}

	setA := toSet(a)
	setB := toSet(b)

	var common int
	for k := range setA {
		if _, ok := setB[k]; ok {
			common++
		}
	}

	union := len(setA) + len(setB) - common
	if union == 0 {
		return 0
	}

	score := float64(common) / float64(union)
	if common >= 3 {
		score += 0.10
	}

	return clamp01(score)
}

func calcSoftAgeScore(ageFrom, ageTo, candidateAge int) float64 {
	if ageFrom == 0 && ageTo == 0 {
		return 1
	}

	if ageFrom > ageTo && ageTo != 0 {
		ageFrom, ageTo = ageTo, ageFrom
	}

	center := float64(ageFrom+ageTo) / 2.0
	diff := math.Abs(float64(candidateAge) - center)
	halfRange := math.Max(float64(ageTo-ageFrom)/2.0, 1)

	if candidateAge >= ageFrom && candidateAge <= ageTo {
		return clamp01(1.0 - 0.4*(diff/halfRange))
	}

	extraDiff := diff - halfRange
	score := 0.6 * math.Exp(-extraDiff/4.0)

	return clamp01(score)
}

func calcSoftCityScore(expectedCity, candidateCity string) float64 {
	if expectedCity == "" {
		return 1
	}
	if strings.EqualFold(expectedCity, candidateCity) {
		return 1
	}
	return 0.25
}

func calcGoalScoreV2(expected, actual domain.RelationshipGoal) float64 {
	if expected == "" {
		return 1
	}
	if expected == actual {
		return 1
	}

	if (expected == domain.GoalFriendship && actual == domain.GoalCommunication) ||
		(expected == domain.GoalCommunication && actual == domain.GoalFriendship) {
		return 0.60
	}

	if expected == domain.GoalSerious || actual == domain.GoalSerious {
		return 0.15
	}

	return 0.20
}

func calcLifestyleScoreV2(expected, actual domain.Lifestyle) float64 {
	if expected == "" {
		return 1
	}
	if expected == actual {
		return 1
	}

	if (expected == domain.LifestyleActive && actual == domain.LifestyleBalanced) ||
		(expected == domain.LifestyleBalanced && actual == domain.LifestyleActive) ||
		(expected == domain.LifestyleBalanced && actual == domain.LifestyleHome) ||
		(expected == domain.LifestyleHome && actual == domain.LifestyleBalanced) {
		return 0.55
	}

	return 0.20
}

func calcBadHabitsScoreV2(expected, actual []string) float64 {
	if len(expected) == 0 {
		if len(actual) == 0 {
			return 1
		}
		return 0.85
	}

	if len(actual) == 0 {
		return 0.15
	}

	expectedSet := toSet(expected)
	actualSet := toSet(actual)

	var common int
	for k := range expectedSet {
		if _, ok := actualSet[k]; ok {
			common++
		}
	}

	if common == 0 {
		return 0.05
	}

	return clamp01(float64(common) / float64(len(expectedSet)))
}

func calcSearchBadHabitsScoreV2(allowed, candidateHabits []string) float64 {
	if len(allowed) == 0 {
		if len(candidateHabits) == 0 {
			return 1
		}
		return 0.90
	}

	return calcBadHabitsScoreV2(allowed, candidateHabits)
}

func toSet(values []string) map[string]struct{} {
	set := make(map[string]struct{}, len(values))
	for _, v := range values {
		key := strings.ToLower(strings.TrimSpace(v))
		if key == "" {
			continue
		}
		set[key] = struct{}{}
	}
	return set
}

func clamp01(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}
