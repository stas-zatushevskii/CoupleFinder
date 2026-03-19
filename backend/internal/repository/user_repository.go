package repository

import (
	"context"

	"backend/internal/domain"
)

type UserRepository interface {
	ListUsersForMatching(ctx context.Context, limit int) ([]domain.User, error)
	ListUsersForSearch(ctx context.Context, limit int) ([]domain.User, error)
}
