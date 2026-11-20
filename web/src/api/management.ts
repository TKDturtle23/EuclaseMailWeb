export interface Domain {
    id: number
    name: string
    verified: boolean
}

export interface Alias {
    id: number
    domain_id: number
    mailbox_id: number
    local_part: string
    address: string
    mailbox_address: string
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
        if (response.status === 403) throw new Error('MFA verification is required.')
        if (response.status === 404) throw new Error('The selected resource was not found or is not yours.')
        if (response.status === 409) throw new Error('That address or domain already exists.')
        if (response.status === 400) throw new Error('Please check the supplied information.')
        throw new Error(`Request failed (${response.status}).`)
    }

    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
}

export function getDomains() {
    return request<Domain[]>('/api/domains')
}

export function createDomain(name: string) {
    return request<Domain>('/api/domains', {
        method: 'POST',
        body: JSON.stringify({ name }),
    })
}

export function getAliases() {
    return request<Alias[]>('/api/aliases')
}

export function createAlias(
    domain_id: number,
    mailbox_id: number,
    local_part: string,
) {
    return request<Alias>('/api/aliases', {
        method: 'POST',
        body: JSON.stringify({ domain_id, mailbox_id, local_part }),
    })
}

export function deleteAlias(id: number) {
    return request<void>(`/api/aliases/${id}`, {
        method: 'DELETE',
    })
}