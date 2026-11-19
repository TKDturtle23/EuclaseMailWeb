import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react'

import {
    getCurrentUser,
    login as apiLogin,
    logout as apiLogout,
    type AuthUser,
} from '../api/auth'

interface AuthContextType {
    user: AuthUser | null
    loading: boolean
    login: (username: string, password: string) => Promise<AuthUser>
    refresh: () => Promise<AuthUser | null>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    async function refresh(): Promise<AuthUser | null> {
        try {
            const currentUser = await getCurrentUser()
            setUser(currentUser)
            return currentUser
        } catch {
            setUser(null)
            return null
        }
    }

    async function login(
        username: string,
        password: string
    ): Promise<AuthUser> {
        await apiLogin(username, password)

        const currentUser = await refresh()

        if (!currentUser) {
            throw new Error('Unable to establish session')
        }

        return currentUser
    }

    async function logout() {
        try {
            await apiLogout()
        } finally {
            setUser(null)
        }
    }

    useEffect(() => {
        refresh().finally(() => setLoading(false))
    }, [])

    return (
        <AuthContext.Provider
            value={{ user, loading, login, refresh, logout }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider')
    }

    return context
}