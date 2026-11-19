import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
    verifyMfa,
    verifyRecoveryCode,
} from '../api/auth'

import { useAuth } from '../contexts/AuthContext'
import '../styles/Auth.css'

export default function Mfa() {
    const navigate = useNavigate()
    const { refresh } = useAuth()

    const [code, setCode] = useState('')
    const [recoveryMode, setRecoveryMode] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (recoveryMode) {
                await verifyRecoveryCode(code)
            } else {
                await verifyMfa(code)
            }

            await refresh()
            navigate('/dash')
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Verification failed'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="AuthPage">
            <form className="AuthCard" onSubmit={handleSubmit}>
                <h1>Verify your identity</h1>

                <p>
                    {recoveryMode
                        ? 'Enter one of your unused recovery codes.'
                        : 'Enter the current code from your authenticator app.'}
                </p>

                <label>
                    {recoveryMode ? 'Recovery code' : 'Authenticator code'}
                </label>

                <input
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    autoComplete="one-time-code"
                    required
                />

                {error && <div className="AuthError">{error}</div>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify'}
                </button>

                <button
                    type="button"
                    className="AuthSecondaryButton"
                    onClick={() => {
                        setRecoveryMode(!recoveryMode)
                        setCode('')
                        setError('')
                    }}
                >
                    {recoveryMode
                        ? 'Use authenticator instead'
                        : 'Use a recovery code'}
                </button>
            </form>
        </div>
    )
}