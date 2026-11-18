
import { useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'

import type {
    AuthUser,
    LoginResponse,
} from '../api/client'

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<LoginResponse>
    onMfaLogin: (challengeToken: string, code: string) => Promise<AuthUser>
    onAuthenticated: (user: AuthUser) => void
}

function LoginPage({
                       onLogin,
                       onMfaLogin,
                       onAuthenticated,
                   }: LoginPageProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [code, setCode] = useState('')
    const [challengeToken, setChallengeToken] = useState<string | null>(null)

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await onLogin(email, password)

            if ('mfa_required' in result && result.mfa_required) {
                setChallengeToken(result.challenge_token)
                setPassword('')
                setCode('')
                return
            }

            onAuthenticated(result)
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Unable to sign in.',
            )
        } finally {
            setLoading(false)
        }
    }

    async function handleMfaSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!challengeToken) return

        setError('')
        setLoading(true)

        try {
            const authenticatedUser = await onMfaLogin(
                challengeToken,
                code.trim(),
            )

            onAuthenticated(authenticatedUser)
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'MFA verification failed.',
            )
        } finally {
            setLoading(false)
        }
    }

    function returnToPasswordLogin() {
        setChallengeToken(null)
        setCode('')
        setPassword('')
        setError('')
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <div className="login-brand-icon">
                    <Mail size={25} />
                </div>

                <h1>LoyalMail</h1>

                <p className="login-subtitle">
                    {challengeToken
                        ? 'Verify your identity to continue.'
                        : 'Sign in to access your mailbox.'}
                </p>

                {!challengeToken ? (
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="email">Email address</label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="username"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            required
                            disabled={loading}
                        />

                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                            disabled={loading}
                        />

                        {error && (
                            <div className="form-error" role="alert">
                                {error}
                            </div>
                        )}

                        <button
                            className="primary-button login-submit"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleMfaSubmit}>
                        <label htmlFor="mfa-code">
                            Authenticator or recovery code
                        </label>

                        <input
                            id="mfa-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="Enter your code"
                            value={code}
                            onChange={(event) =>
                                setCode(event.target.value)
                            }
                            required
                            autoFocus
                            disabled={loading}
                        />

                        {error && (
                            <div className="form-error" role="alert">
                                {error}
                            </div>
                        )}

                        <button
                            className="primary-button login-submit"
                            type="submit"
                            disabled={loading || !code.trim()}
                        >
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>

                        <button
                            className="secondary-button"
                            type="button"
                            onClick={returnToPasswordLogin}
                            disabled={loading}
                            style={{ width: '100%', marginTop: '10px' }}
                        >
                            Back to sign in
                        </button>
                    </form>
                )}
            </section>
        </main>
    )
}

export default LoginPage
