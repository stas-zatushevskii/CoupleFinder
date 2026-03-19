-- +goose Up
CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       name VARCHAR(100) NOT NULL,
                       gender VARCHAR(20) NOT NULL,
                       age INT NOT NULL,
                       city VARCHAR(100) NOT NULL,
                       relationship_goal VARCHAR(50) NOT NULL,
                       lifestyle VARCHAR(50) NOT NULL,
                       bio TEXT,
                       created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE if exists users;