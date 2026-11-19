export interface AuthUser {
    user_id: number
    username: string
    role: string
    mfa_enabled: boolean
    mfa_verified: boolean
}

interface LoginResponse {
    user_id: number
    username: string
    role: string
    mfa_enabled: boolean
    mfa_required: boolean
}

async function request<T>(
    path: string,
    options: RequestInit = {}
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
        if (response.status === 401) {
            throw new Error('Authentication failed')
        }

        if (response.status === 429) {
            throw new Error('Too many attempts. Try again later.')
        }

        throw new Error(`Request failed (${response.status})`)
    }

    return response.json() as Promise<T>
}

export async function login(
    username: string,
    password: string
): Promise<LoginResponse> {
    return request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    })
}

export async function getCurrentUser(): Promise<AuthUser> {
    return request('/api/auth/me')
}

export async function logout(): Promise<void> {
    await request('/api/auth/logout', {
        method: 'POST',
    })
}

export async function startMfaEnrollment(): Promise<{ qr_code: string }> {
    return request('/api/auth/mfa/enroll', {
        method: 'POST',
    })
}

export async function verifyMfaEnrollment(code: string): Promise<void> {
    await request('/api/auth/mfa/verify-enrollment', {
        method: 'POST',
        body: JSON.stringify({ code }),
    })
}

export async function verifyMfa(code: string): Promise<void> {
    await request('/api/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
    })
}

export async function verifyRecoveryCode(code: string): Promise<void> {
    await request('/api/auth/mfa/recovery', {
        method: 'POST',
        body: JSON.stringify({ code }),
    })
}

export async function generateRecoveryCodes(): Promise<string[]> {
    const result = await request<{ recovery_codes: string[] }>(
        '/api/auth/mfa/recovery-codes',
        { method: 'POST' }
    )

    return result.recovery_codes
}