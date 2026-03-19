package repository

import (
	"context"
	"database/sql"

	"backend/internal/domain"
)

type PostgresRunRepository struct {
	db *sql.DB
}

func NewPostgresRunRepository(db *sql.DB) *PostgresRunRepository {
	return &PostgresRunRepository{db: db}
}

func (r *PostgresRunRepository) SaveRunResult(ctx context.Context, result domain.RunResult, usersCount int) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	var runID int64
	err = tx.QueryRowContext(ctx, `
		INSERT INTO algorithm_runs (
			algorithm_name,
			users_count,
			execution_time_ms,
			pairs_found,
			avg_score
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`,
		result.AlgorithmName,
		usersCount,
		result.ExecutionTimeMs,
		len(result.Pairs),
		result.AvgScore,
	).Scan(&runID)
	if err != nil {
		return err
	}

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO algorithm_pairs (
			run_id,
			user_a_id,
			user_b_id,
			compatibility_score
		)
		VALUES ($1, $2, $3, $4)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, p := range result.Pairs {
		if _, err := stmt.ExecContext(ctx, runID, p.UserAID, p.UserBID, p.Score); err != nil {
			return err
		}
	}

	return tx.Commit()
}
