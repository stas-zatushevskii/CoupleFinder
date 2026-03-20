package repository

import (
	"context"

	"backend/internal/domain"
)

type UserRepository interface {
	ListUsersForMatching(ctx context.Context, limit int, filters domain.SearchFilters) ([]domain.User, error)
	ListUsersForSearch(ctx context.Context, limit int, filters domain.SearchFilters) ([]domain.User, error)
	GetUserByID(ctx context.Context, id int64) (domain.User, error)
	CreateUser(ctx context.Context, user domain.User) (int64, error)
}
