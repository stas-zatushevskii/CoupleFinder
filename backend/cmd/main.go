package main

import (
	"backend/internal/service"
	"log"
	"net/http"

	"backend/internal/config"
	"backend/internal/matching"
	postgresrepo "backend/internal/repository/postgres"
	transporthttp "backend/internal/transport/http"
	"backend/pkg/postgres"
)

func main() {
	cfg := config.Load()

	db, err := postgres.New(cfg.DSN)
	if err != nil {
		log.Fatal(err)
	}

	if err := postgres.RunMigrations(db); err != nil {
		log.Fatal(err)
	}

	userRepo := postgresrepo.NewPostgresUserRepository(db)
	runRepo := postgresrepo.NewPostgresRunRepository(db)

	scorer := matching.NewScorer()

	matchService := service.NewMatchService(
		userRepo,
		runRepo,
		matching.NewCollaborativeFiltering(scorer),
		matching.NewGaleShapley(scorer),
		matching.NewAntColony(scorer),
	)

	searchService := service.NewSearchService(
		userRepo,
		scorer,
	)

	handler := transporthttp.NewHandler(matchService, searchService)
	router := transporthttp.NewRouter(handler)

	log.Printf("server started on %s", cfg.HTTPAddr)
	if err := http.ListenAndServe(cfg.HTTPAddr, router); err != nil {
		log.Fatal(err)
	}
}
