package http

type RunMatchRequest struct {
	Algorithm string `json:"algorithm"`
	Limit     int    `json:"limit"`
}

type PairDTO struct {
	UserAID int64   `json:"user_a_id"`
	UserBID int64   `json:"user_b_id"`
	Score   float64 `json:"score"`
}

type RunMatchResponse struct {
	AlgorithmName   string    `json:"algorithm_name"`
	ExecutionTimeMs int64     `json:"execution_time_ms"`
	PairsFound      int       `json:"pairs_found"`
	AvgScore        float64   `json:"avg_score"`
	Pairs           []PairDTO `json:"pairs"`
}

type CompareResponse struct {
	Results []RunMatchResponse `json:"results"`
}

type AlgorithmMetrics struct {
	AlgorithmName   string  `json:"algorithm_name"`
	ExecutionTimeMs int64   `json:"execution_time_ms"`
	TotalFound      int     `json:"total_found"`
	AvgScore        float64 `json:"avg_score"`
	MaxScore        float64 `json:"max_score"`
	MinScore        float64 `json:"min_score"`
}

type SearchFiltersDTO struct {
	Gender           string   `json:"gender"`
	AgeFrom          int      `json:"age_from"`
	AgeTo            int      `json:"age_to"`
	City             string   `json:"city"`
	RelationshipGoal string   `json:"relationship_goal"`
	Lifestyle        string   `json:"lifestyle"`
	HasBadHabits     bool     `json:"has_bad_habits"`
	BadHabits        []string `json:"bad_habits"`
	Interests        []string `json:"interests"`
}

type RunCompareRequest struct {
	Limit   int              `json:"limit"`
	Filters SearchFiltersDTO `json:"filters"`
}

type CandidateDTO struct {
	UserID    int64    `json:"user_id"`
	Name      string   `json:"name"`
	Age       int      `json:"age"`
	City      string   `json:"city"`
	Score     float64  `json:"score"`
	Interests []string `json:"interests"`
	BadHabits []string `json:"bad_habits"`
}

type CompareAlgorithmResultDTO struct {
	AlgorithmName   string         `json:"algorithm_name"`
	ExecutionTimeMs int64          `json:"execution_time_ms"`
	TotalFound      int            `json:"total_found"`
	AvgScore        float64        `json:"avg_score"`
	MaxScore        float64        `json:"max_score"`
	MinScore        float64        `json:"min_score"`
	Candidates      []CandidateDTO `json:"candidates"`
}

type CompareSearchResponse struct {
	Results []CompareAlgorithmResultDTO `json:"results"`
}

type RunSearchRequest struct {
	Algorithm string           `json:"algorithm"`
	Limit     int              `json:"limit"`
	Filters   SearchFiltersDTO `json:"filters"`
}

type RunSearchResponse struct {
	AlgorithmName   string         `json:"algorithm_name"`
	ExecutionTimeMs int64          `json:"execution_time_ms"`
	TotalFound      int            `json:"total_found"`
	Candidates      []CandidateDTO `json:"candidates"`
}
