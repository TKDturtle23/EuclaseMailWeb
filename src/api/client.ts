
export interface User {
    id: number
    username: string
    email: string
    enabled: boolean
    created_at: number
}

export interface CreateUserRequest {
    username: string
    password: string
    primary_local_part: string
}

async function request<T>(
    path: string,
    options?: RequestInit,
): Promise<T> {
    const response = await fetch(path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    })

    if (!response.ok) {
        const message = await response.text()
        throw new Error(message || `HTTP ${response.status}`)
    }

    if (response.status === 204) {
        return undefined as T
    }

    return response.json() as Promise<T>
}

export const api = {
    getDomains(): Promise<string[]> {
        return request('/api/domains')
    },

    getUsers(domain: string): Promise<User[]> {
        return request(
            `/api/domains/${encodeURIComponent(domain)}/users`,
        )
    },

    createUser(
        domain: string,
        user: CreateUserRequest,
    ): Promise<User> {
        return request(
            `/api/domains/${encodeURIComponent(domain)}/users`,
            {
                method: 'POST',
                body: JSON.stringify(user),
            },
        )
    },

    deleteUser(domain: string, userId: number): Promise<void> {
        return request(
            `/api/domains/${encodeURIComponent(domain)}/users/${userId}`,
            {
                method: 'DELETE',
            },
        )
    },
}
