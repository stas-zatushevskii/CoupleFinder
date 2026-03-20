package repository

import (
	"context"

	"backend/internal/domain"
)

type RunRepository interface {
	SaveRunResult(ctx context.Context, result domain.RunResult) error
	GetRuns(ctx context.Context, algorithm string, runKind domain.RunKind) ([]domain.AlgorithmRun, error)
}
