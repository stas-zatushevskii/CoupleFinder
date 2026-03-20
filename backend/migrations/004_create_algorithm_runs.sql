-- +goose Up
CREATE TABLE algorithm_runs (
                                id BIGSERIAL PRIMARY KEY,

                                algorithm_name VARCHAR(50) NOT NULL,

                                users_count INT NOT NULL,
                                eligible_edges INT,
                                unmatched_users INT,
                                pairs_found INT NOT NULL,

                                execution_time_ms INT NOT NULL,
                                preparation_time_ms INT,
                                matching_time_ms INT,
                                scoring_time_ms INT,
                                score_calls BIGINT DEFAULT 0,

                                best_score NUMERIC(8,4),
                                worst_score NUMERIC(8,4),
                                avg_score NUMERIC(8,4),
                                median_score NUMERIC(8,4),
                                sum_score NUMERIC(10,4),
                                coverage_ratio NUMERIC(8,4),
                                score_stddev NUMERIC(10,4),

                                proposal_count BIGINT,
                                switch_count BIGINT,
                                mutual_topk_checks BIGINT,
                                rejected_candidates BIGINT,

                                iterations INT,
                                ants INT,
                                solutions_built BIGINT,
                                best_iteration INT,

                                created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS algorithm_runs;