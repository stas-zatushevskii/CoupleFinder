CREATE TABLE algorithm_pairs (
                                 id BIGSERIAL PRIMARY KEY,
                                 run_id BIGINT NOT NULL REFERENCES algorithm_runs(id) ON DELETE CASCADE,
                                 user_a_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                 user_b_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                 compatibility_score NUMERIC(6,4) NOT NULL
);