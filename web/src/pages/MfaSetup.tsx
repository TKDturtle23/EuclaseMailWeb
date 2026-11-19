import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
    startMfaEnrollment,
    verifyMfaEnrollment,
    generateRecoveryCodes,
} from '../api/auth'

import { useAuth } from '../contexts/AuthContext'
import '../styles/Auth.css'

export default function MfaSetup() {
    const navigate = useNavigate()
    const { refresh } = useAuth()

    const [qrCode, setQrCode] = useState('')
    const [code, setCode] = useState('')
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        startMfaEnrollment()
            .then(result => setQrCode(result.qr_code))
            .catch(() => setError('Unable to start MFA enrollment'))
    }, [])

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await verifyMfaEnrollment(code)
            await refresh()

            const codes = await generateRecoveryCodes()
            setRecoveryCodes(codes)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Verification failed'
            )
        } finally {
            setLoading(false)
        }
    }

    if (recoveryCodes.length > 0) {
        return (
            <div className="AuthPage">
                <div className="AuthCard">
                    <h1>Save your recovery codes</h1>
                    <p>
                        These codes can each be used once if you lose
                        access to your authenticator. Save them somewhere
                        secure. They will not be shown again.
                    </p>

                    <div className="RecoveryCodes">
                        {recoveryCodes.map(code => (
                            <code key={code}>{code}</code>
                        ))}
                    </div>

                    <button onClick={() => navigate('/dash')}>
                        Continue to LoyalMail
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="AuthPage">
            <form className="AuthCard" onSubmit={handleVerify}>
                <h1>Set up MFA</h1>
                <p>
                    Scan this QR code with Google Authenticator or
                    another TOTP-compatible authenticator.
                </p>

                {qrCode && (
                    <img
                        className="MfaQrCode"
                        src={`data:image/png;base64,${qrCode}`}
                        alt="MFA enrollment QR code"
                    />
                )}

                <label>Authenticator code</label>
                <input
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="123456"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                />

                {error && <div className="AuthError">{error}</div>}

                <button type="submit" disabled={loading || !qrCode}>
                    {loading ? 'Verifying...' : 'Enable MFA'}
                </button>
            </form>
        </div>
    )
}