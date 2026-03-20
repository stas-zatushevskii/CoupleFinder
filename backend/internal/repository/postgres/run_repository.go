package repository

import (
	"context"
	"database/sql"
	"strconv"
	"strings"

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
			run_kind,
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
			score_stddev,
			proposal_count,
			switch_count,
			mutual_topk_checks,
			rejected_candidates,
			iterations,
			ants,
			solutions_built,
			best_iteration,
			pheromone_updates,
			roulette_calls,
			convergence_iteration
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16, $17, $18,
			$19, $20, $21, $22, $23, $24, $25, $26,
			$27, $28, $29
		)
		RETURNING id
	`,
		result.RunKind,
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
		nullInt64(result.Analytics.ProposalCount),
		nullInt64(result.Analytics.SwitchCount),
		nullInt64(result.Analytics.MutualTopKChecks),
		nullInt64(result.Analytics.RejectedCandidates),
		nullInt(result.Analytics.Iterations),
		nullInt(result.Analytics.Ants),
		nullInt64(result.Analytics.SolutionsBuilt),
		nullInt(result.Analytics.BestIteration),
		nullInt64(result.Analytics.PheromoneUpdates),
		nullInt64(result.Analytics.RouletteCalls),
		nullInt(result.Analytics.ConvergenceIteration),
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

func nullInt(v int) sql.NullInt64 {
	if v == 0 {
		return sql.NullInt64{}
	}
	return sql.NullInt64{
		Int64: int64(v),
		Valid: true,
	}
}

func nullInt64(v int64) sql.NullInt64 {
	if v == 0 {
		return sql.NullInt64{}
	}
	return sql.NullInt64{
		Int64: v,
		Valid: true,
	}
}

func (r *PostgresRunRepository) GetRuns(ctx context.Context, algorithm string, runKind domain.RunKind) ([]domain.AlgorithmRun, error) {
	query := `
		SELECT
			id,
			run_kind,
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
			COALESCE(mutual_topk_checks, 0),
			COALESCE(rejected_candidates, 0),
			COALESCE(proposal_count, 0),
			COALESCE(switch_count, 0),
			COALESCE(iterations, 0),
			COALESCE(ants, 0),
			COALESCE(solutions_built, 0),
			COALESCE(pheromone_updates, 0),
			COALESCE(roulette_calls, 0),
			COALESCE(best_iteration, 0),
			COALESCE(convergence_iteration, 0),
			created_at
		FROM algorithm_runs
	`
	args := make([]any, 0)
	whereParts := make([]string, 0, 2)

	if runKind != "" {
		args = append(args, runKind)
		whereParts = append(whereParts, `run_kind = $1`)
	}

	if algorithm != "" {
		args = append(args, algorithm)
		whereParts = append(whereParts, `algorithm_name = $`+strconv.Itoa(len(args)))
	}

	if len(whereParts) > 0 {
		query += ` WHERE ` + strings.Join(whereParts, ` AND `)
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
			&run.RunKind,
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
			&run.MutualTopKChecks,
			&run.RejectedCandidates,
			&run.ProposalCount,
			&run.SwitchCount,
			&run.Iterations,
			&run.Ants,
			&run.SolutionsBuilt,
			&run.PheromoneUpdates,
			&run.RouletteCalls,
			&run.BestIteration,
			&run.ConvergenceIteration,
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
