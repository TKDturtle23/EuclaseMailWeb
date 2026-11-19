
const API_URL = '/api'

export async function apiRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`)

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json() as Promise<T>
}
