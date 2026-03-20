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
    | 'best_score'
    | 'avg_score'
    | 'sum_score'
    | 'coverage_ratio'
    | 'pairs_found'
    | 'eligible_edges'
    | 'score_calls'

export type AnalyticsRunDTO = {
    id: number
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

    created_at: string
}

export type AnalyticsResponse = {
    runs: AnalyticsRunDTO[]
}