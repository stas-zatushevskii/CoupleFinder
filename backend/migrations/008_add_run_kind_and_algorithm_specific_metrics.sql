-- +goose Up
ALTER TABLE algorithm_runs
    ADD COLUMN IF NOT EXISTS run_kind VARCHAR(20) NOT NULL DEFAULT 'match',
    ADD COLUMN IF NOT EXISTS pheromone_updates BIGINT,
    ADD COLUMN IF NOT EXISTS roulette_calls BIGINT,
    ADD COLUMN IF NOT EXISTS convergence_iteration INT;

UPDATE algorithm_runs ar
SET run_kind = 'search'
WHERE ar.eligible_edges = 0
  AND NOT EXISTS (
      SELECT 1
      FROM algorithm_pairs ap
      WHERE ap.run_id = ar.id
  );

-- +goose Down
ALTER TABLE algorithm_runs
    DROP COLUMN IF EXISTS convergence_iteration,
    DROP COLUMN IF EXISTS roulette_calls,
    DROP COLUMN IF EXISTS pheromone_updates,
    DROP COLUMN IF EXISTS run_kind;
