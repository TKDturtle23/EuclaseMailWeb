
import { apiRequest } from './client'

export interface HealthResponse {
    status: string
}

export function getServerHealth(): Promise<HealthResponse> {
    return apiRequest<HealthResponse>('/health')
}
