package http

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"backend/internal/domain"
	"backend/internal/service"
)

type Handler struct {
	matchService  *service.MatchService
	searchService *service.SearchService
}

func NewHandler(
	matchService *service.MatchService,
	searchService *service.SearchService,
) *Handler {
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

	matchFilters := domain.SearchFilters{
		Gender:           domain.Gender(req.Filters.Gender),
		AgeFrom:          req.Filters.AgeFrom,
		AgeTo:            req.Filters.AgeTo,
		City:             req.Filters.City,
		RelationshipGoal: domain.RelationshipGoal(req.Filters.RelationshipGoal),
		Lifestyle:        domain.Lifestyle(req.Filters.Lifestyle),
		BadHabits:        req.Filters.BadHabits,
		Interests:        req.Filters.Interests,
	}

	if req.Personal {
		seekerGender := domain.Gender(req.UserGender)
		if seekerGender == "" {
			// если не пришло, попробуем противоположный выбранному партнеру
			if matchFilters.Gender == domain.GenderFemale {
				seekerGender = domain.GenderMale
			} else {
				seekerGender = domain.GenderFemale
			}
		}

		result, err := h.matchService.RunForUser(r.Context(), req.Algorithm, req.Limit, req.UserID, seekerGender, matchFilters)
		if err != nil {
			log.Printf("RunMatch personal: error running run: %v", err)
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, toRunMatchResponse(result))
		return
	}

	result, err := h.matchService.Run(r.Context(), req.Algorithm, req.Limit, matchFilters)
	if err != nil {
		log.Printf("RunMatch: error running run: %v", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, toRunMatchResponse(result))
}

func (h *Handler) CompareAlgorithms(w http.ResponseWriter, r *http.Request) {
	limit := 100

	if r.ContentLength > 0 {
		var req RunCompareRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("CompareAlgorithms: error decoding body: %v", err)
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if req.Limit > 0 {
			limit = req.Limit
		}
	}

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

func (h *Handler) GetAnalytics(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	algorithm := r.URL.Query().Get("algorithm")

	runs, err := h.matchService.GetRuns(r.Context(), algorithm)
	if err != nil {
		log.Printf("GetAnalytics: error getting analytics: %v", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := AnalyticsResponse{
		Runs: make([]AnalyticsRunDTO, 0, len(runs)),
	}

	for _, run := range runs {
		resp.Runs = append(resp.Runs, toAnalyticsRunDTO(run))
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
		SeekerID:        result.SeekerID,
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

func toAnalyticsRunDTO(run domain.AlgorithmRun) AnalyticsRunDTO {
	return AnalyticsRunDTO{
		ID:                   run.ID,
		RunKind:              string(run.RunKind),
		AlgorithmName:        run.AlgorithmName,
		UsersCount:           run.UsersCount,
		EligibleEdges:        run.EligibleEdges,
		UnmatchedUsers:       run.UnmatchedUsers,
		PairsFound:           run.PairsFound,
		ExecutionTimeMs:      run.ExecutionTimeMs,
		PreparationTimeMs:    run.PreparationTimeMs,
		MatchingTimeMs:       run.MatchingTimeMs,
		ScoringTimeMs:        run.ScoringTimeMs,
		ScoreCalls:           run.ScoreCalls,
		BestScore:            run.BestScore,
		WorstScore:           run.WorstScore,
		AvgScore:             run.AvgScore,
		MedianScore:          run.MedianScore,
		SumScore:             run.SumScore,
		CoverageRatio:        run.CoverageRatio,
		ScoreStdDev:          run.ScoreStdDev,
		MutualTopKChecks:     run.MutualTopKChecks,
		RejectedCandidates:   run.RejectedCandidates,
		ProposalCount:        run.ProposalCount,
		SwitchCount:          run.SwitchCount,
		Iterations:           run.Iterations,
		Ants:                 run.Ants,
		SolutionsBuilt:       run.SolutionsBuilt,
		PheromoneUpdates:     run.PheromoneUpdates,
		RouletteCalls:        run.RouletteCalls,
		BestIteration:        run.BestIteration,
		ConvergenceIteration: run.ConvergenceIteration,
		CreatedAt:            run.CreatedAt.Format(time.RFC3339),
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
