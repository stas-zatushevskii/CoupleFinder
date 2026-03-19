package http

import "net/http"

func NewRouter(handler *Handler) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/v1/search/run", handler.RunSearch)
	mux.HandleFunc("POST /api/v1/match/run", handler.RunMatch)
	mux.HandleFunc("POST /api/v1/experiments/compare", handler.CompareAlgorithms)
	mux.HandleFunc("GET /health", handler.Health)

	return mux
}
