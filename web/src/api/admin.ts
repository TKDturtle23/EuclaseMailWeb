export interface AdminUser {
    id: number
    username: string
    role: 'user' | 'admin'
}

async function request<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const response = await fetch(path, {
        ...options,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    })

    if (!response.ok) {
        if (response.status === 401) throw new Error('Your session has expired.')
        if (response.status === 403) throw new Error('You do not have permission.')
        if (response.status === 404) throw new Error('User not found.')
        if (response.status === 409) throw new Error('This action conflicts with an account restriction.')
        if (response.status === 400) throw new Error('The supplied information is invalid.')
        throw new Error(`Request failed (${response.status}).`)
    }

    if (response.status === 204) {
        return undefined as T
    }

    return response.json() as Promise<T>
}

export function getUsers() {
    return request<AdminUser[]>('/api/admin/users')
}

export function createUser(username: string, password: string) {
    return request<AdminUser>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    })
}

export function updateUserRole(id: number, role: 'user' | 'admin') {
    return request<void>(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
    })
}

export function resetUserMfa(id: number) {
    return request<void>(`/api/admin/users/${id}/mfa`, {
        method: 'POST',
    })
}

export function deleteUser(id: number) {
    return request<void>(`/api/admin/users/${id}`, {
        method: 'DELETE',
    })
}