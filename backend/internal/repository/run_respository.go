package repository

import (
	"context"

	"backend/internal/domain"
)

type RunRepository interface {
	SaveRunResult(ctx context.Context, result domain.RunResult) error
	GetRuns(ctx context.Context, algorithm string) ([]domain.AlgorithmRun, error)
}
