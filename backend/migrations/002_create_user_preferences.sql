-- +goose Up
CREATE TABLE user_preferences (
                                  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                                  preferred_gender VARCHAR(20) NOT NULL,
                                  age_from INT NOT NULL,
                                  age_to INT NOT NULL,
                                  preferred_city VARCHAR(100),
                                  preferred_goal VARCHAR(50),
                                  preferred_lifestyle VARCHAR(50),
                                  preferred_bad_habits VARCHAR(50)
);

-- +goose Down
DROP TABLE if exists user_preferences;