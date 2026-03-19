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

func (s *Scorer) Score(a, b domain.User) float64 {
	if !passesHardFilters(a.Preferences, b) {
		return 0
	}

	interestsScore := calcInterestsScore(a.Interests, b.Interests)
	ageScore := calcAgeScore(a.Preferences.AgeFrom, a.Preferences.AgeTo, b.Age)
	cityScore := calcCityScore(a.Preferences.PreferredCity, b.City)
	goalScore := calcGoalScore(a.Preferences.PreferredGoal, b.RelationshipGoal)
	lifestyleScore := calcLifestyleScore(a.Preferences.PreferredLifestyle, b.Lifestyle)
	habitsScore := calcBadHabitsScore(a.Preferences.PreferredBadHabits, b.BadHabits)

	score := 0.40*interestsScore +
		0.20*ageScore +
		0.15*cityScore +
		0.10*goalScore +
		0.10*lifestyleScore +
		0.05*habitsScore

	return clamp01(score)
}

func (s *Scorer) ScoreBySearch(filters domain.SearchFilters, candidate domain.User) float64 {
	if filters.Gender != "" && filters.Gender != candidate.Gender {
		return 0
	}
	if candidate.Age < filters.AgeFrom || candidate.Age > filters.AgeTo {
		return 0
	}
	if filters.City != "" && !strings.EqualFold(filters.City, candidate.City) {
		return 0
	}

	interestsScore := calcInterestsScore(filters.Interests, candidate.Interests)
	ageScore := calcAgeScore(filters.AgeFrom, filters.AgeTo, candidate.Age)
	cityScore := calcCityScore(filters.City, candidate.City)
	goalScore := calcGoalScore(filters.RelationshipGoal, candidate.RelationshipGoal)
	lifestyleScore := calcLifestyleScore(filters.Lifestyle, candidate.Lifestyle)
	habitsScore := calcSearchBadHabitsScore(filters.BadHabits, candidate.BadHabits)

	score := 0.40*interestsScore +
		0.20*ageScore +
		0.15*cityScore +
		0.10*goalScore +
		0.10*lifestyleScore +
		0.05*habitsScore

	return clamp01(score)
}

func passesHardFilters(pref domain.Preferences, candidate domain.User) bool {
	if pref.PreferredGender != "" && pref.PreferredGender != candidate.Gender {
		return false
	}
	if candidate.Age < pref.AgeFrom || candidate.Age > pref.AgeTo {
		return false
	}
	if pref.PreferredCity != "" && !strings.EqualFold(pref.PreferredCity, candidate.City) {
		return false
	}
	return true
}

func calcInterestsScore(a, b []string) float64 {
	if len(a) == 0 {
		return 0
	}

	set := make(map[string]struct{}, len(a))
	for _, v := range a {
		set[strings.ToLower(strings.TrimSpace(v))] = struct{}{}
	}

	var common int
	for _, v := range b {
		if _, ok := set[strings.ToLower(strings.TrimSpace(v))]; ok {
			common++
		}
	}

	return float64(common) / float64(len(a))
}

func calcAgeScore(ageFrom, ageTo, candidateAge int) float64 {
	center := float64(ageFrom+ageTo) / 2.0
	diff := math.Abs(float64(candidateAge) - center)

	maxAllowedDiff := math.Max(float64(ageTo-ageFrom)/2.0, 1)
	score := 1 - diff/maxAllowedDiff

	return clamp01(score)
}

func calcCityScore(expectedCity, candidateCity string) float64 {
	if expectedCity == "" {
		return 1
	}
	if strings.EqualFold(expectedCity, candidateCity) {
		return 1
	}
	return 0
}

func calcGoalScore(expected, actual domain.RelationshipGoal) float64 {
	if expected == "" {
		return 1
	}
	if expected == actual {
		return 1
	}
	if (expected == domain.GoalFriendship && actual == domain.GoalCommunication) ||
		(expected == domain.GoalCommunication && actual == domain.GoalFriendship) {
		return 0.5
	}
	return 0
}

func calcLifestyleScore(expected, actual domain.Lifestyle) float64 {
	if expected == "" {
		return 1
	}
	if expected == actual {
		return 1
	}

	// Подстрой при необходимости под свои актуальные enum'ы lifestyle.
	if (expected == domain.LifestyleActive && actual == domain.LifestyleBalanced) ||
		(expected == domain.LifestyleBalanced && actual == domain.LifestyleActive) ||
		(expected == domain.LifestyleBalanced && actual == domain.LifestyleHome) ||
		(expected == domain.LifestyleHome && actual == domain.LifestyleBalanced) {
		return 0.5
	}

	return 0
}

// calcBadHabitsScore сравнивает предпочтительный список привычек пользователя
// и фактический список привычек кандидата.
func calcBadHabitsScore(expected, actual []string) float64 {
	// Если ожиданий нет — не штрафуем.
	if len(expected) == 0 {
		return 1
	}

	// Если у кандидата нет привычек, а ожидания заданы — совпадений нет.
	if len(actual) == 0 {
		return 0
	}

	expectedSet := toSet(expected)

	var common int
	for _, v := range actual {
		if _, ok := expectedSet[strings.ToLower(strings.TrimSpace(v))]; ok {
			common++
		}
	}

	if common == 0 {
		return 0
	}

	// Доля покрытых ожиданий
	return float64(common) / float64(len(expectedSet))
}

// calcSearchBadHabitsScore логика для формы поиска.
// hasBadHabits=false -> кандидат должен быть без привычек.
// hasBadHabits=true и список пуст -> допускаются любые привычки.
// hasBadHabits=true и список непустой -> считаем пересечение.
func calcSearchBadHabitsScore(allowed, candidateHabits []string) float64 {

	if len(allowed) == 0 {
		return 1
	}

	return calcBadHabitsScore(allowed, candidateHabits)
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
