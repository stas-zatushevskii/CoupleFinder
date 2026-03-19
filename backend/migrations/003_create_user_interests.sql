-- +goose Up
CREATE TABLE user_interests (
                                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                interest VARCHAR(100) NOT NULL,
                                PRIMARY KEY (user_id, interest)
);

-- +goose Down
DROP TABLE if exists user_interests;