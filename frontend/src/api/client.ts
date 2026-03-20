import type {
    AnalyticsResponse,
    RunSearchResponse,
    HealthResponse,
} from '../types/api'

export class ApiClient {
    private readonly baseUrl: string

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }

    async healthCheck(): Promise<HealthResponse> {
        const resp = await fetch(`${this.baseUrl}/health`)
        if (!resp.ok) {
            throw new Error(`Health check failed: ${resp.status}`)
        }
        return resp.json()
    }

    async runSearch(payload: unknown): Promise<RunSearchResponse> {
        const resp = await fetch(`${this.baseUrl}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })

        if (!resp.ok) {
            const text = await resp.text()
            throw new Error(text || `Run search failed: ${resp.status}`)
        }

        return resp.json()
    }

    async getAnalytics(algorithm?: string): Promise<AnalyticsResponse> {
        const url = new URL(`${this.baseUrl}/analytics`)
        if (algorithm) {
            url.searchParams.set('algorithm', algorithm)
        }

        const resp = await fetch(url.toString())
        if (!resp.ok) {
            const text = await resp.text()
            throw new Error(text || `Get analytics failed: ${resp.status}`)
        }

        return resp.json()
    }
}