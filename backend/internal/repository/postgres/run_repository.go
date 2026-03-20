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

func (r *PostgresRunRepository) SaveRunResult(ctx context.Context, result domain.RunResult) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	var runID int64
	err = tx.QueryRowContext(ctx, `
		INSERT INTO algorithm_runs (
			algorithm_name,
			users_count,
			eligible_edges,
			unmatched_users,
			pairs_found,
			execution_time_ms,
			preparation_time_ms,
			matching_time_ms,
			scoring_time_ms,
			score_calls,
			best_score,
			worst_score,
			avg_score,
			median_score,
			sum_score,
			coverage_ratio,
			score_stddev
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16, $17
		)
		RETURNING id
	`,
		result.AlgorithmName,
		result.Analytics.UsersCount,
		result.Analytics.EligibleEdges,
		result.Analytics.UnmatchedUsers,
		result.Analytics.PairsFound,
		result.ExecutionTimeMs,
		result.Analytics.PreparationTimeMs,
		result.Analytics.MatchingTimeMs,
		result.Analytics.ScoringTimeMs,
		result.Analytics.ScoreCalls,
		nullFloat(result.Analytics.BestScore),
		nullFloat(result.Analytics.WorstScore),
		nullFloat(result.Analytics.AvgScore),
		nullFloat(result.Analytics.MedianScore),
		nullFloat(result.Analytics.SumScore),
		nullFloat(result.Analytics.CoverageRatio),
		nullFloat(result.Analytics.ScoreStdDev),
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

func nullFloat(v float64) sql.NullFloat64 {
	if v == 0 {
		return sql.NullFloat64{}
	}
	return sql.NullFloat64{
		Float64: v,
		Valid:   true,
	}
}

func (r *PostgresRunRepository) GetRuns(ctx context.Context, algorithm string) ([]domain.AlgorithmRun, error) {
	query := `
		SELECT
			id,
			algorithm_name,
			users_count,
			eligible_edges,
			unmatched_users,
			pairs_found,
			execution_time_ms,
			preparation_time_ms,
			matching_time_ms,
			scoring_time_ms,
			score_calls,
			COALESCE(best_score, 0),
			COALESCE(worst_score, 0),
			COALESCE(avg_score, 0),
			COALESCE(median_score, 0),
			COALESCE(sum_score, 0),
			COALESCE(coverage_ratio, 0),
			COALESCE(score_stddev, 0),
			created_at
		FROM algorithm_runs
	`
	args := make([]any, 0)

	if algorithm != "" {
		query += ` WHERE algorithm_name = $1`
		args = append(args, algorithm)
	}

	query += ` ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	runs := make([]domain.AlgorithmRun, 0)
	for rows.Next() {
		var run domain.AlgorithmRun

		err := rows.Scan(
			&run.ID,
			&run.AlgorithmName,
			&run.UsersCount,
			&run.EligibleEdges,
			&run.UnmatchedUsers,
			&run.PairsFound,
			&run.ExecutionTimeMs,
			&run.PreparationTimeMs,
			&run.MatchingTimeMs,
			&run.ScoringTimeMs,
			&run.ScoreCalls,
			&run.BestScore,
			&run.WorstScore,
			&run.AvgScore,
			&run.MedianScore,
			&run.SumScore,
			&run.CoverageRatio,
			&run.ScoreStdDev,
			&run.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		runs = append(runs, run)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return runs, nil
}
