package domain

type Pair struct {
	UserAID int64
	UserBID int64
	Score   float64
}

type RunResult struct {
	AlgorithmName   string
	ExecutionTimeMs int64
	Pairs           []Pair
	AvgScore        float64
}
