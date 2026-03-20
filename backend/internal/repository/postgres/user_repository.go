package repository

import (
	"context"
	"database/sql"
	"strconv"
	"strings"

	"backend/internal/domain"
	"github.com/lib/pq"
)

type PostgresUserRepository struct {
	db *sql.DB
}

func NewPostgresUserRepository(db *sql.DB) *PostgresUserRepository {
	return &PostgresUserRepository{db: db}
}

func (r *PostgresUserRepository) ListUsersForMatching(ctx context.Context, limit int, filters domain.SearchFilters) ([]domain.User, error) {
	users, filtered, err := r.queryUsers(ctx, limit, filters, true)
	if err != nil {
		return nil, err
	}

	if filtered && len(users) < 2 {
		fallback, _, err := r.queryUsers(ctx, limit, domain.SearchFilters{}, true)
		if err != nil {
			return nil, err
		}
		return fallback, nil
	}

	return users, nil
}

func (r *PostgresUserRepository) ListUsersForSearch(ctx context.Context, limit int, filters domain.SearchFilters) ([]domain.User, error) {
	users, _, err := r.queryUsers(ctx, limit, filters, false)
	return users, err
}

func (r *PostgresUserRepository) GetUserByID(ctx context.Context, id int64) (domain.User, error) {
	filters := domain.SearchFilters{}
	users, _, err := r.queryUsers(ctx, 1, filters, false, withID(id))
	if err != nil {
		return domain.User{}, err
	}
	if len(users) == 0 {
		return domain.User{}, sql.ErrNoRows
	}
	return users[0], nil
}

func (r *PostgresUserRepository) CreateUser(ctx context.Context, user domain.User) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer func() { _ = tx.Rollback() }()

	var userID int64
	err = tx.QueryRowContext(ctx, `
		INSERT INTO users (
			name, gender, age, city, relationship_goal, lifestyle, bio
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`,
		user.Name,
		user.Gender,
		user.Age,
		strings.ToLower(user.City),
		user.RelationshipGoal,
		user.Lifestyle,
		user.Bio,
	).Scan(&userID)
	if err != nil {
		return 0, err
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO user_preferences (
			user_id, preferred_gender, age_from, age_to, preferred_city, preferred_goal, preferred_lifestyle
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`,
		userID,
		user.Preferences.PreferredGender,
		user.Preferences.AgeFrom,
		user.Preferences.AgeTo,
		strings.ToLower(user.Preferences.PreferredCity),
		user.Preferences.PreferredGoal,
		user.Preferences.PreferredLifestyle,
	)
	if err != nil {
		return 0, err
	}

	if len(user.Interests) > 0 {
		stmt, err := tx.PrepareContext(ctx, `INSERT INTO user_interests (user_id, interest) VALUES ($1, $2)`)
		if err != nil {
			return 0, err
		}
		for _, interest := range user.Interests {
			if _, err := stmt.ExecContext(ctx, userID, interest); err != nil {
				stmt.Close()
				return 0, err
			}
		}
		stmt.Close()
	}

	if len(user.BadHabits) > 0 {
		stmt, err := tx.PrepareContext(ctx, `INSERT INTO user_bad_habits (user_id, bad_habit) VALUES ($1, $2)`)
		if err != nil {
			return 0, err
		}
		for _, habit := range user.BadHabits {
			if _, err := stmt.ExecContext(ctx, userID, habit); err != nil {
				stmt.Close()
				return 0, err
			}
		}
		stmt.Close()
	}

	if len(user.Preferences.PreferredBadHabits) > 0 {
		stmt, err := tx.PrepareContext(ctx, `INSERT INTO user_preferred_bad_habits (user_id, bad_habit) VALUES ($1, $2)`)
		if err != nil {
			return 0, err
		}
		for _, habit := range user.Preferences.PreferredBadHabits {
			if _, err := stmt.ExecContext(ctx, userID, habit); err != nil {
				stmt.Close()
				return 0, err
			}
		}
		stmt.Close()
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return userID, nil
}

type extraFilter func() (string, []any)

func withID(id int64) extraFilter {
	return func() (string, []any) {
		return "u.id = $X", []any{id}
	}
}

func (r *PostgresUserRepository) queryUsers(ctx context.Context, limit int, filters domain.SearchFilters, widenGender bool, extras ...extraFilter) ([]domain.User, bool, error) {
	query := `
		SELECT 
			u.id,
			u.name,
			u.gender,
			u.age,
			u.city,
			u.relationship_goal,
			u.lifestyle,
			u.bio,	
			p.preferred_gender,
			p.age_from,
			p.age_to,
			p.preferred_city,
			p.preferred_goal,
			p.preferred_lifestyle
		FROM users u
		JOIN user_preferences p ON p.user_id = u.id
	`

	args := make([]any, 0, 8+len(extras))
	whereParts := make([]string, 0, 8+len(extras))

	if filters.Gender != "" {
		args = append(args, filters.Gender)
		placeholder := "$" + itoa(len(args))
		if widenGender {
			whereParts = append(whereParts, "(u.gender = "+placeholder+" OR p.preferred_gender = "+placeholder+")")
		} else {
			whereParts = append(whereParts, "u.gender = "+placeholder)
		}
	}
	if filters.AgeFrom > 0 {
		args = append(args, filters.AgeFrom)
		whereParts = append(whereParts, "u.age >= $"+itoa(len(args)))
	}
	if filters.AgeTo > 0 {
		args = append(args, filters.AgeTo)
		whereParts = append(whereParts, "u.age <= $"+itoa(len(args)))
	}
	if filters.City != "" {
		args = append(args, strings.ToLower(filters.City))
		whereParts = append(whereParts, "LOWER(u.city) = $"+itoa(len(args)))
	}
	if filters.RelationshipGoal != "" {
		args = append(args, filters.RelationshipGoal)
		whereParts = append(whereParts, "u.relationship_goal = $"+itoa(len(args)))
	}
	if filters.Lifestyle != "" {
		args = append(args, filters.Lifestyle)
		whereParts = append(whereParts, "u.lifestyle = $"+itoa(len(args)))
	}
	if len(filters.BadHabits) > 0 {
		args = append(args, pq.Array(filters.BadHabits))
		whereParts = append(whereParts, `
			EXISTS (
				SELECT 1
				FROM user_bad_habits ubh
				WHERE ubh.user_id = u.id
				  AND ubh.bad_habit = ANY($`+itoa(len(args))+`)
			)
		`)
	}
	if len(filters.Interests) > 0 {
		args = append(args, pq.Array(filters.Interests))
		whereParts = append(whereParts, `
			EXISTS (
				SELECT 1
				FROM user_interests ui
				WHERE ui.user_id = u.id
				  AND ui.interest = ANY($`+itoa(len(args))+`)
			)
		`)
	}

	for _, ex := range extras {
		if ex == nil {
			continue
		}
		cond, vals := ex()
		for _, v := range vals {
			args = append(args, v)
			cond = strings.Replace(cond, "$X", "$"+itoa(len(args)), 1)
		}
		whereParts = append(whereParts, cond)
	}

	if len(whereParts) > 0 {
		query += " WHERE " + strings.Join(whereParts, " AND ")
	}
	filtered := len(whereParts) > 0

	query += "\n ORDER BY u.id"
	if limit > 0 {
		args = append(args, limit)
		query += "\n LIMIT $" + itoa(len(args))
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, filtered, err
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
			&u.Bio,
			&pref.PreferredGender,
			&pref.AgeFrom,
			&pref.AgeTo,
			&pref.PreferredCity,
			&pref.PreferredGoal,
			&pref.PreferredLifestyle,
		); err != nil {
			return nil, filtered, err
		}

		interests, err := r.listUserInterests(ctx, u.ID)
		if err != nil {
			return nil, filtered, err
		}
		u.Interests = interests

		badHabits, err := r.listUserBadHabits(ctx, u.ID)
		if err != nil {
			return nil, filtered, err
		}
		u.BadHabits = badHabits

		preferredBadHabits, err := r.listPreferredBadHabits(ctx, u.ID)
		if err != nil {
			return nil, filtered, err
		}
		pref.PreferredBadHabits = preferredBadHabits

		u.Preferences = pref
		users = append(users, u)
	}

	if err := rows.Err(); err != nil {
		return nil, filtered, err
	}

	return users, filtered, nil
}

func itoa(v int) string {
	return strconv.Itoa(v)
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

func (r *PostgresUserRepository) listUserBadHabits(ctx context.Context, userID int64) ([]string, error) {
	query := `SELECT bad_habit FROM user_bad_habits WHERE user_id = $1 ORDER BY bad_habit`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var habits []string
	for rows.Next() {
		var habit string
		if err := rows.Scan(&habit); err != nil {
			return nil, err
		}
		habits = append(habits, habit)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return habits, nil
}

func (r *PostgresUserRepository) listPreferredBadHabits(ctx context.Context, userID int64) ([]string, error) {
	query := `SELECT bad_habit FROM user_preferred_bad_habits WHERE user_id = $1 ORDER BY bad_habit`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var habits []string
	for rows.Next() {
		var habit string
		if err := rows.Scan(&habit); err != nil {
			return nil, err
		}
		habits = append(habits, habit)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return habits, nil
}
