package http

import "net/http"

func NewRouter(handler *Handler) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("POST /search", handler.RunSearch)
	mux.HandleFunc("POST /match", handler.RunMatch)
	mux.HandleFunc("POST /experiments/compare", handler.CompareAlgorithms)
	mux.HandleFunc("GET /health", handler.Health)
	mux.HandleFunc("GET /analytics", handler.GetAnalytics)

	return mux
}
