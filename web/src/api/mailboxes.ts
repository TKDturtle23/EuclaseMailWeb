export interface Mailbox {
    id: number
    user_id: number
    domain_id: number
    local_part: string
    address: string
}

export interface Domain {
    id: number
    name: string
    verified: boolean
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
        if (response.status === 403) throw new Error('You must verify MFA again.')
        if (response.status === 404) throw new Error('Domain not found or not owned by you.')
        if (response.status === 409) throw new Error('That mailbox address already exists.')
        if (response.status === 400) throw new Error('Invalid mailbox name.')
        throw new Error(`Request failed (${response.status}).`)
    }

    if (response.status === 204) {
        return undefined as T
    }

    return response.json() as Promise<T>
}

export function getMailboxes() {
    return request<Mailbox[]>('/api/mailboxes')
}

export function getDomains() {
    return request<Domain[]>('/api/domains')
}

export function createMailbox(domain_id: number, local_part: string) {
    return request<Mailbox>('/api/mailboxes', {
        method: 'POST',
        body: JSON.stringify({ domain_id, local_part }),
    })
}