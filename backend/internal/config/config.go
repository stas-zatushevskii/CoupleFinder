package config

import (
	"os"
)

type Config struct {
	HTTPAddr string
	DSN      string
}

func Load() Config {
	cfg := Config{
		HTTPAddr: getEnv("HTTP_ADDR", ":8080"),
		DSN:      getEnv("POSTGRES_DSN", "postgres://postgres:postgres@localhost:5432/app?sslmode=disable"),
	}
	return cfg
}

func getEnv(key, fallback string) string {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	return v
}
