package repository

import (
	"context"

	"backend/internal/domain"
)

type RunRepository interface {
	SaveRunResult(ctx context.Context, result domain.RunResult, usersCount int) error
}
