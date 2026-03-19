import type {
    HealthResponse,
    RunSearchRequest,
    RunSearchResponse,
} from '../types/api'

export class ApiClient {
    private readonly baseUrl: string

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers ?? {}),
            },
            ...options,
        })

        const data = await response.json().catch(() => null)

        if (!response.ok) {
            const message =
                data && typeof data === 'object' && 'error' in data
                    ? String((data as { error: string }).error)
                    : `HTTP ${response.status}`
            throw new Error(message)
        }

        return data as T
    }

    healthCheck(): Promise<HealthResponse> {
        return this.request<HealthResponse>('/health', { method: 'GET' })
    }

    runSearch(payload: RunSearchRequest): Promise<RunSearchResponse> {
        return this.request<RunSearchResponse>('/api/v1/search/run', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
    }
}