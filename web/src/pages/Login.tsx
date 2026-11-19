import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Auth.css'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const user = await login(username, password)

            if (!user.mfa_enabled) {
                navigate('/mfa-setup')
            } else if (!user.mfa_verified) {
                navigate('/mfa')
            } else {
                navigate('/dash')
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Login failed'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="AuthPage">
            <form className="AuthCard" onSubmit={handleSubmit}>
                <h1>LoyalMail</h1>
                <p>Sign in to your account</p>

                <label>Username</label>
                <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                />

                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                />

                {error && <div className="AuthError">{error}</div>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>
        </div>
    )
}