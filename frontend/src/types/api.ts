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