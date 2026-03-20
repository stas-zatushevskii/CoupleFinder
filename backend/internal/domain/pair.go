package domain

type RunKind string

const (
	RunKindMatch  RunKind = "match"
	RunKindSearch RunKind = "search"
)

type Pair struct {
	UserAID int64
	UserBID int64
	Score   float64
}

type RunResult struct {
	RunKind         RunKind
	AlgorithmName   string
	ExecutionTimeMs int64
	Pairs           []Pair
	AvgScore        float64
	SeekerID        int64
	Analytics       RunAnalytics
}
