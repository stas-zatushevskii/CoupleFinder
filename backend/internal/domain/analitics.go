package domain

import "time"

type RunAnalytics struct {
	UsersCount     int
	EligibleEdges  int
	PairsFound     int
	UnmatchedUsers int
	CoverageRatio  float64

	BestScore   float64
	WorstScore  float64
	AvgScore    float64
	MedianScore float64
	SumScore    float64
	ScoreStdDev float64

	PreparationTimeMs int64
	MatchingTimeMs    int64
	ScoringTimeMs     int64
	ScoreCalls        int64

	// CF
	MutualTopKChecks   int64
	RejectedCandidates int64

	// GS
	ProposalCount int64
	SwitchCount   int64

	// AC
	Iterations           int
	Ants                 int
	SolutionsBuilt       int64
	PheromoneUpdates     int64
	RouletteCalls        int64
	BestIteration        int
	ConvergenceIteration int
}

type AlgorithmRun struct {
	ID             int64
	AlgorithmName  string
	UsersCount     int
	EligibleEdges  int
	UnmatchedUsers int
	PairsFound     int

	ExecutionTimeMs   int64
	PreparationTimeMs int64
	MatchingTimeMs    int64
	ScoringTimeMs     int64
	ScoreCalls        int64

	BestScore     float64
	WorstScore    float64
	AvgScore      float64
	MedianScore   float64
	SumScore      float64
	CoverageRatio float64
	ScoreStdDev   float64

	CreatedAt time.Time
}
