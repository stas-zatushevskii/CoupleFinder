package domain

import "context"

type MatchingAlgorithm interface {
	Name() string
	Run(ctx context.Context, users []User) (RunResult, error)
}
