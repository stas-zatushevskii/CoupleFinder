export type Algorithm = 'collaborative_filtering' | 'gale_shapley' | 'ant_colony'

export type SearchFilters = {
    gender: string
    age_from: number
    age_to: number
    city: string
    relationship_goal: string
    lifestyle: string
    has_bad_habits: boolean
    bad_habits: string[]
    interests: string[]
}

export type RunSearchRequest = {
    algorithm: Algorithm
    limit: number
    filters: SearchFilters
}

export type RunMatchRequest = {
    algorithm: Algorithm
    limit: number
    filters: SearchFilters
    user_id?: number
    user_gender?: string
    personal?: boolean
}

export type CompareAlgorithmsResponse = {
    results: Array<{
        algorithm_name: Algorithm | string
        execution_time_ms: number
        pairs_found: number
        avg_score: number
    }>
}

export type PairDTO = {
    user_a_id: number
    user_b_id: number
    score: number
}

export type RunMatchResponse = {
    algorithm_name: string
    execution_time_ms: number
    pairs_found: number
    avg_score: number
    seeker_id?: number
    pairs: PairDTO[]
}

export type CandidateDTO = {
    user_id: number
    name: string
    age: number
    city: string
    score: number
    interests: string[]
}

export type RunSearchResponse = {
    algorithm_name: string
    execution_time_ms: number
    total_found: number
    candidates: CandidateDTO[]
}

export type HealthResponse = {
    status: string
}

export type AnalyticsMetric =
    | 'execution_time_ms'
    | 'preparation_time_ms'
    | 'matching_time_ms'
    | 'scoring_time_ms'
    | 'best_score'
    | 'avg_score'
    | 'sum_score'
    | 'coverage_ratio'
    | 'pairs_found'
    | 'eligible_edges'
    | 'score_calls'
    | 'proposal_count'
    | 'switch_count'
    | 'mutual_topk_checks'
    | 'rejected_candidates'
    | 'iterations'
    | 'solutions_built'
    | 'pheromone_updates'
    | 'roulette_calls'
    | 'best_iteration'
    | 'convergence_iteration'

export type AnalyticsRunDTO = {
    id: number
    run_kind: string
    algorithm_name: Algorithm | string
    users_count: number
    eligible_edges: number
    unmatched_users: number
    pairs_found: number

    execution_time_ms: number
    preparation_time_ms: number
    matching_time_ms: number
    scoring_time_ms: number
    score_calls: number

    best_score: number
    worst_score: number
    avg_score: number
    median_score: number
    sum_score: number
    coverage_ratio: number
    score_stddev: number

    mutual_topk_checks: number
    rejected_candidates: number
    proposal_count: number
    switch_count: number
    iterations: number
    ants: number
    solutions_built: number
    pheromone_updates: number
    roulette_calls: number
    best_iteration: number
    convergence_iteration: number

    created_at: string
}

export type AnalyticsResponse = {
    runs: AnalyticsRunDTO[]
}
