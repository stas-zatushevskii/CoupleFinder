-- +goose Up
CREATE TABLE user_preferred_bad_habits (
                                           user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                           bad_habit VARCHAR(100) NOT NULL,
                                           PRIMARY KEY (user_id, bad_habit)
);

-- +goose Down
DROP TABLE if exists user_preferred_bad_habits;