-- +goose Up
CREATE TABLE algorithm_runs (
                                id BIGSERIAL PRIMARY KEY,
                                algorithm_name VARCHAR(50) NOT NULL,
                                users_count INT NOT NULL,
                                execution_time_ms INT NOT NULL,
                                pairs_found INT NOT NULL,
                                avg_score NUMERIC(6,4),
                                created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE if exists algorithm_runs;