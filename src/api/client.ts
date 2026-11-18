
export interface User {
    id: number
    username: string
    email: string
    enabled: boolean
    created_at: number
}

export interface AuthUser {
    id: number
    email: string
    username?: string
    is_admin: boolean
}

export interface LoginRequest {
    email: string
    password: string
}
export interface AdminElevationResponse {
    elevated: boolean
    expires_in_seconds: number
    inactivity_timeout_seconds: number
}
export interface MfaStatusResponse {
    enabled: boolean
}
export interface Mailbox {
    id: number
    name: string
}

export interface Message {
    id: string
    mailbox_id: number
    from: string
    to: string
    subject: string
    received_at: number
    size_bytes: number
}
export interface MfaSetupResponse {
    secret_base32: string
    otpauth_url: string
    qr_code_base64: string
}

export interface MfaVerifySetupResponse {
    enabled: boolean
    recovery_codes: string[]
}

export interface MfaLoginChallenge {
    mfa_required: true
    challenge_token: string
}

export type LoginResponse = AuthUser | MfaLoginChallenge

export interface MfaLoginRequest {
    challenge_token: string
    code: string
}
async function request<T>(
    path: string,
    options?: RequestInit,
): Promise<T> {
    const response = await fetch(path, {
        ...options,
        credentials: 'include',
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
async function requestText(path: string): Promise<string> {
    const response = await fetch(path, {
        credentials: 'include',
    })

    if (!response.ok) {
        const message = await response.text()
        throw new Error(message || `HTTP ${response.status}`)
    }

    return response.text()
}
export const api = {
    login(email: string, password: string): Promise<LoginResponse> {
        return request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        })
    },

    loginMfa(challengeToken: string, code: string): Promise<AuthUser> {
        return request('/api/auth/login/mfa', {
            method: 'POST',
            body: JSON.stringify({
                challenge_token: challengeToken,
                code,
            }),
        })
    },

    getMe(): Promise<AuthUser> {
        return request('/api/auth/me')
    },

    logout(): Promise<void> {
        return request('/api/auth/logout', {
            method: 'POST',
        })
    },
    elevateAdminSession(code: string): Promise<AdminElevationResponse> {
        return request('/api/auth/admin/elevate', {
            method: 'POST',
            body: JSON.stringify({ code }),
        })
    },
    getDomains(): Promise<string[]> {
        return request('/api/domains')
    },

    getUsers(domain: string): Promise<User[]> {
        return request(
            `/api/domains/${encodeURIComponent(domain)}/users`,
        )
    },
    getMfaStatus(): Promise<MfaStatusResponse> {
        return request('/api/auth/mfa/status')
    },

    setupMfa(): Promise<MfaSetupResponse> {
        return request('/api/auth/mfa/setup', {
            method: 'POST',
        })
    },

    verifyMfaSetup(code: string): Promise<MfaVerifySetupResponse> {
        return request('/api/auth/mfa/verify-setup', {
            method: 'POST',
            body: JSON.stringify({ code }),
        })
    },
    deleteUser(domain: string, userId: number): Promise<void> {
        return request(
            `/api/domains/${encodeURIComponent(domain)}/users/${userId}`,
            { method: 'DELETE' },
        )
    },
    getMailboxes(): Promise<Mailbox[]> {
        return request('/api/mailboxes')
    },

    createMailbox(name: string): Promise<Mailbox> {
        return request('/api/mailboxes', {
            method: 'POST',
            body: JSON.stringify({ name }),
        })
    },

    getMessages(mailboxId: number): Promise<Message[]> {
        return request(
            `/api/mailboxes/${mailboxId}/messages`,
        )
    },

    getMessage(
        mailboxId: number,
        messageId: string,
    ): Promise<string> {
        return requestText(
            `/api/mailboxes/${mailboxId}/messages/${encodeURIComponent(messageId)}`
        )
    },

    deleteMessage(
        mailboxId: number,
        messageId: string,
    ): Promise<void> {
        return request(
            `/api/mailboxes/${mailboxId}/messages/${encodeURIComponent(messageId)}`,
            {
                method: 'DELETE',
            }
        )
    },

    moveMessage(
        mailboxId: number,
        messageId: string,
        destinationMailboxId: number,
    ): Promise<void> {
        return request(
            `/api/mailboxes/${mailboxId}/messages/${encodeURIComponent(messageId)}/move`,
            {
                method: 'POST',
                body: JSON.stringify({
                    destination_mailbox_id: destinationMailboxId,
                }),
            }
        )
    },
}
