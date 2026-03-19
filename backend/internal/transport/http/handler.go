package http

import (
	"encoding/json"
	"log"
	"net/http"

	"backend/internal/domain"
	"backend/internal/service"
)

type Handler struct {
	matchService  *service.MatchService
	searchService *service.SearchService
}

func NewHandler(matchService *service.MatchService, searchService *service.SearchService) *Handler {
	return &Handler{
		matchService:  matchService,
		searchService: searchService,
	}
}

func (h *Handler) RunMatch(w http.ResponseWriter, r *http.Request) {
	var req RunMatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("RunMatch: error decoding body: %v", err)
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Algorithm == "" {
		log.Printf("RunMatch: invalid algorithm parameter")
		writeError(w, http.StatusBadRequest, "algorithm is required")
		return
	}
	if req.Limit <= 0 {
		req.Limit = 100
	}

	result, err := h.matchService.Run(r.Context(), req.Algorithm, req.Limit)
	if err != nil {
		log.Printf("RunMatch: error running run: %v", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, toRunMatchResponse(result))
}

func (h *Handler) CompareAlgorithms(w http.ResponseWriter, r *http.Request) {
	limit := 100

	results, err := h.matchService.CompareAll(r.Context(), limit)
	if err != nil {
		log.Printf("CompareAlgorithms: error comparing algorithms: %v", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := CompareResponse{
		Results: make([]RunMatchResponse, 0, len(results)),
	}
	for _, result := range results {
		resp.Results = append(resp.Results, toRunMatchResponse(result))
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) RunSearch(w http.ResponseWriter, r *http.Request) {
	var req RunSearchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("RunSearch: error decoding body: %v", err)
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Algorithm == "" {
		log.Printf("RunSearch: algorithm is required")
		writeError(w, http.StatusBadRequest, "algorithm is required")
		return
	}

	if req.Limit <= 0 {
		req.Limit = 100
	}

	searchReq := domain.SearchRequest{
		Algorithm: req.Algorithm,
		Limit:     req.Limit,
		Filters: domain.SearchFilters{
			Gender:           domain.Gender(req.Filters.Gender),
			AgeFrom:          req.Filters.AgeFrom,
			AgeTo:            req.Filters.AgeTo,
			City:             req.Filters.City,
			RelationshipGoal: domain.RelationshipGoal(req.Filters.RelationshipGoal),
			Lifestyle:        domain.Lifestyle(req.Filters.Lifestyle),
			BadHabits:        req.Filters.BadHabits,
			Interests:        req.Filters.Interests,
		},
	}

	result, err := h.searchService.Run(r.Context(), searchReq)
	if err != nil {
		log.Printf("RunSearch: error running searchService.Run: %v", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := RunSearchResponse{
		AlgorithmName:   result.AlgorithmName,
		ExecutionTimeMs: result.ExecutionTimeMs,
		TotalFound:      len(result.Candidates),
		Candidates:      make([]CandidateDTO, 0, len(result.Candidates)),
	}

	for _, c := range result.Candidates {
		resp.Candidates = append(resp.Candidates, CandidateDTO{
			UserID:    c.User.ID,
			Name:      c.User.Name,
			Age:       c.User.Age,
			City:      c.User.City,
			Score:     c.Score,
			Interests: c.User.Interests,
			BadHabits: c.User.BadHabits,
		})
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func toRunMatchResponse(result domain.RunResult) RunMatchResponse {
	resp := RunMatchResponse{
		AlgorithmName:   result.AlgorithmName,
		ExecutionTimeMs: result.ExecutionTimeMs,
		PairsFound:      len(result.Pairs),
		AvgScore:        result.AvgScore,
		Pairs:           make([]PairDTO, 0, len(result.Pairs)),
	}

	for _, p := range result.Pairs {
		resp.Pairs = append(resp.Pairs, PairDTO{
			UserAID: p.UserAID,
			UserBID: p.UserBID,
			Score:   p.Score,
		})
	}

	return resp
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
