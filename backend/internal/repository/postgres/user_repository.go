package repository

import (
	"context"
	"database/sql"

	"backend/internal/domain"
)

type PostgresUserRepository struct {
	db *sql.DB
}

func NewPostgresUserRepository(db *sql.DB) *PostgresUserRepository {
	return &PostgresUserRepository{db: db}
}

func (r *PostgresUserRepository) ListUsersForMatching(ctx context.Context, limit int) ([]domain.User, error) {
	query := `
		SELECT 
			u.id,
			u.name,
			u.gender,
			u.age,
			u.city,
			u.relationship_goal,
			u.lifestyle,
			u.bad_habits,
			u.bio,
			p.preferred_gender,
			p.age_from,
			p.age_to,
			p.preferred_city,
			p.preferred_goal,
			p.preferred_lifestyle,
			p.preferred_bad_habits
		FROM users u
		JOIN user_preferences p ON p.user_id = u.id
		ORDER BY u.id
		LIMIT $1
	`

	rows, err := r.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []domain.User
	for rows.Next() {
		var u domain.User
		var pref domain.Preferences

		if err := rows.Scan(
			&u.ID,
			&u.Name,
			&u.Gender,
			&u.Age,
			&u.City,
			&u.RelationshipGoal,
			&u.Lifestyle,
			&u.BadHabits,
			&u.Bio,
			&pref.PreferredGender,
			&pref.AgeFrom,
			&pref.AgeTo,
			&pref.PreferredCity,
			&pref.PreferredGoal,
			&pref.PreferredLifestyle,
			&pref.PreferredBadHabits,
		); err != nil {
			return nil, err
		}

		u.Preferences = pref

		interests, err := r.listUserInterests(ctx, u.ID)
		if err != nil {
			return nil, err
		}
		u.Interests = interests

		users = append(users, u)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func (r *PostgresUserRepository) ListUsersForSearch(ctx context.Context, limit int) ([]domain.User, error) {
	return r.ListUsersForMatching(ctx, limit)
}

func (r *PostgresUserRepository) listUserInterests(ctx context.Context, userID int64) ([]string, error) {
	query := `SELECT interest FROM user_interests WHERE user_id = $1 ORDER BY interest`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var interests []string
	for rows.Next() {
		var interest string
		if err := rows.Scan(&interest); err != nil {
			return nil, err
		}
		interests = append(interests, interest)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return interests, nil
}
