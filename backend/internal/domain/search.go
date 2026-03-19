package domain

type SearchRequest struct {
	Algorithm string
	Limit     int
	Filters   SearchFilters
}

type SearchFilters struct {
	Gender           Gender
	AgeFrom          int
	AgeTo            int
	City             string
	RelationshipGoal RelationshipGoal
	Lifestyle        Lifestyle
	BadHabits        []string
	Interests        []string
}

type CandidateResult struct {
	User  User
	Score float64
}

type SearchResult struct {
	AlgorithmName   string
	ExecutionTimeMs int64
	Candidates      []CandidateResult
}
