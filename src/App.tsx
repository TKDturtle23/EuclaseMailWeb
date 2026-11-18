
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, LogOut, RefreshCw } from 'lucide-react'
import type { CSSProperties, FormEvent } from 'react'
import {
    api,
    type AuthUser,
    type User,
    type LoginResponse,
} from './api/client'
import Sidebar, { type Page } from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import UsersPage from './pages/Users'
import LoginPage from './pages/Login'
import MailExplorer from './pages/MailExplorer'

import './App.css'

function App() {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [adminView, setAdminView] = useState(false)

    const [page, setPage] = useState<Page>('dashboard')
    const [domains, setDomains] = useState<string[]>([])
    const [selectedDomain, setSelectedDomain] = useState('')
    const [users, setUsers] = useState<User[]>([])
    const [adminLoading, setAdminLoading] = useState(false)
    const [error, setError] = useState('')

    const [elevationDialogOpen, setElevationDialogOpen] = useState(false)
    const [elevationCode, setElevationCode] = useState('')
    const [elevationLoading, setElevationLoading] = useState(false)
    const [elevationError, setElevationError] = useState('')
    const [mfaSetup, setMfaSetup] = useState<{
        secret_base32: string
        otpauth_url: string
        qr_code_base64: string
    } | null>(null)

    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
    const [adminAuthStep, setAdminAuthStep] = useState<
        'elevate' | 'setup' | 'verify' | 'recovery'
    >('elevate')
    // Restore an existing login session when the application starts.
    useEffect(() => {
        let active = true

        async function restoreSession() {
            try {
                const currentUser = await api.getMe()

                if (active) {
                    setUser(currentUser)
                }
            } catch {
                if (active) {
                    setUser(null)
                }
            } finally {
                if (active) {
                    setAuthLoading(false)
                }
            }
        }

        restoreSession()

        return () => {
            active = false
        }
    }, [])

    async function handleLogin(
        email: string,
        password: string,
    ): Promise<LoginResponse> {
        return api.login(email, password)
    }

    async function handleMfaLogin(
        challengeToken: string,
        code: string,
    ): Promise<AuthUser> {
        return api.loginMfa(challengeToken, code)
    }

    function handleAuthenticated(authenticatedUser: AuthUser) {
        setUser(authenticatedUser)
        setAdminView(false)
        setElevationDialogOpen(false)
        setError('')
    }

    async function handleLogout() {
        try {
            await api.logout()
        } finally {
            setUser(null)
            setAdminView(false)
            setElevationDialogOpen(false)
            setElevationCode('')
            setElevationError('')
            setDomains([])
            setUsers([])
            setSelectedDomain('')
        }
    }

    async function handleAdminRequest() {
        if (!user?.is_admin) return

        try {
            setElevationError('')
            setElevationCode('')
            setRecoveryCodes([])
            setElevationLoading(true)

            const status = await api.getMfaStatus()

            if (status.enabled) {
                setAdminAuthStep('elevate')
            } else {
                const setup = await api.setupMfa()
                setMfaSetup(setup)
                setAdminAuthStep('setup')
            }

            setElevationDialogOpen(true)
        } catch (error) {
            setElevationError(
                error instanceof Error
                    ? error.message
                    : 'Unable to check MFA status.',
            )
            setAdminAuthStep('setup')
            setElevationDialogOpen(true)
        } finally {
            setElevationLoading(false)
        }
    }
    async function handleMfaSetupVerification(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        try {
            setElevationLoading(true)
            setElevationError('')

            const result = await api.verifyMfaSetup(elevationCode.trim())

            if (!result.enabled) {
                setElevationError('MFA enrollment was not completed.')
                return
            }

            setRecoveryCodes(result.recovery_codes)
            setElevationCode('')
            setAdminAuthStep('recovery')
        } catch (error) {
            setElevationError(
                error instanceof Error
                    ? error.message
                    : 'Unable to verify your authenticator code.',
            )
        } finally {
            setElevationLoading(false)
        }
    }
    async function handleAdminElevation(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!elevationCode.trim()) {
            setElevationError('Enter your authentication code.')
            return
        }

        try {
            setElevationLoading(true)
            setElevationError('')

            const result = await api.elevateAdminSession(elevationCode.trim())

            if (!result.elevated) {
                setElevationError('The server did not elevate this session.')
                return
            }

            setElevationDialogOpen(false)
            setElevationCode('')
            setPage('dashboard')
            setAdminView(true)
            setError('')
        } catch (error) {
            setElevationError(
                error instanceof Error
                    ? error.message
                    : 'Unable to elevate your administrator session.',
            )
        } finally {
            setElevationLoading(false)
        }
    }

    const refreshUsers = useCallback(async () => {
        if (!selectedDomain) return

        const result = await api.getUsers(selectedDomain)
        setUsers(result)
    }, [selectedDomain])

    // Load administrative information only after entering the admin panel.
    useEffect(() => {
        if (!adminView || !user?.is_admin) return

        let active = true

        async function loadAdminData() {
            try {
                setAdminLoading(true)
                setError('')

                const result = await api.getDomains()

                if (!active) return

                setDomains(result)
                setSelectedDomain(result[0] ?? '')
            } catch (error) {
                if (active) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : 'Unable to load administration data.',
                    )
                }
            } finally {
                if (active) {
                    setAdminLoading(false)
                }
            }
        }

        loadAdminData()

        return () => {
            active = false
        }
    }, [adminView, user])

    useEffect(() => {
        if (!adminView || !selectedDomain) {
            setUsers([])
            return
        }

        let active = true

        async function loadUsers() {
            try {
                const result = await api.getUsers(selectedDomain)

                if (active) {
                    setUsers(result)
                }
            } catch (error) {
                if (active) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : 'Failed to load users.',
                    )
                }
            }
        }

        loadUsers()

        return () => {
            active = false
        }
    }, [adminView, selectedDomain])

    function renderAdminPage() {
        if (!selectedDomain && !adminLoading) {
            return (
                <section className="panel">
                    <h2>No domains registered</h2>
                    <p>
                        Register a domain with LoyalMailServer before
                        managing accounts.
                    </p>
                </section>
            )
        }

        switch (page) {
            case 'dashboard':
                return (
                    <Dashboard
                        domains={domains}
                        users={users}
                        selectedDomain={selectedDomain}
                    />
                )

            case 'users':
                return (
                    <UsersPage
                        domain={selectedDomain}
                        users={users}
                        onRefresh={refreshUsers}
                    />
                )

            default:
                return (
                    <section className="panel">
                        <h2>Coming soon</h2>
                        <p>This section is not implemented yet.</p>
                    </section>
                )
        }
    }

    if (authLoading) {
        return (
            <div className="loading-state">
                Connecting to LoyalMailServer...
            </div>
        )
    }

    if (!user) {
        return (
            <LoginPage
                onLogin={handleLogin}
                onMfaLogin={handleMfaLogin}
                onAuthenticated={handleAuthenticated}
            />
        )
    }

    if (!user.is_admin && adminView) {
        setAdminView(false)
        return null
    }

    if (!adminView) {
        return (
            <>
                <MailExplorer
                    user={user}
                    onAdmin={handleAdminRequest}
                    onLogout={handleLogout}
                />

                {elevationDialogOpen && (
                    <div
                        style={dialogOverlayStyle}
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                setElevationDialogOpen(false)
                            }
                        }}
                    >

                        <section
                            style={dialogStyle}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="elevation-title"
                        >
                            {adminAuthStep === 'setup' && (
                                <>
                                    <h2 id="elevation-title">Set up two-factor authentication</h2>

                                    {mfaSetup ? (
                                        <>
                                            <p>
                                                Scan this QR code using an authenticator app
                                                such as Google Authenticator, Microsoft
                                                Authenticator, or Aegis.
                                            </p>

                                            <img
                                                src={`data:image/png;base64,${mfaSetup.qr_code_base64}`}
                                                alt="MFA enrollment QR code"
                                                style={{
                                                    display: 'block',
                                                    width: '200px',
                                                    height: '200px',
                                                    margin: '20px auto',
                                                    background: 'white',
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                }}
                                            />

                                            <p>If you cannot scan the QR code, enter this secret manually:</p>

                                            <code
                                                style={{
                                                    display: 'block',
                                                    padding: '12px',
                                                    overflowWrap: 'anywhere',
                                                    background: 'var(--input-background, #111)',
                                                    borderRadius: '6px',
                                                }}
                                            >
                                                {mfaSetup.secret_base32}
                                            </code>

                                            <button
                                                className="primary-button"
                                                style={{ marginTop: '20px' }}
                                                onClick={() => {
                                                    setElevationCode('')
                                                    setElevationError('')
                                                    setAdminAuthStep('verify')
                                                }}
                                            >
                                                Continue
                                            </button>
                                        </>
                                    ) : (
                                        <p role="alert">
                                            {elevationError || 'Unable to start MFA enrollment.'}
                                        </p>
                                    )}
                                </>
                            )}

                            {adminAuthStep === 'verify' && (
                                <>
                                    <h2 id="elevation-title">Verify your authenticator</h2>

                                    <p>
                                        Enter the six-digit code displayed by your
                                        authenticator app to finish setting up MFA.
                                    </p>

                                    <form onSubmit={handleMfaSetupVerification}>
                                        <label htmlFor="elevation-code" style={fieldLabelStyle}>
                                            Authentication code
                                        </label>

                                        <input
                                            id="elevation-code"
                                            type="text"
                                            value={elevationCode}
                                            onChange={(event) =>
                                                setElevationCode(event.target.value)
                                            }
                                            placeholder="123456"
                                            autoComplete="one-time-code"
                                            autoFocus
                                            disabled={elevationLoading}
                                            style={codeInputStyle}
                                        />

                                        {elevationError && (
                                            <div className="error-banner" role="alert">
                                                {elevationError}
                                            </div>
                                        )}

                                        <div style={dialogActionsStyle}>
                                            <button
                                                type="submit"
                                                className="primary-button"
                                                disabled={elevationLoading || !elevationCode.trim()}
                                            >
                                                {elevationLoading ? 'Verifying...' : 'Verify'}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}

                            {adminAuthStep === 'recovery' && (
                                <>
                                    <h2 id="elevation-title">Save your recovery codes</h2>

                                    <p>
                                        Store these codes somewhere secure. Each code can
                                        only be used once if you lose access to your
                                        authenticator.
                                    </p>

                                    <div
                                        style={{
                                            display: 'grid',
                                            gap: '8px',
                                            padding: '14px',
                                            background: 'var(--input-background, #111)',
                                            borderRadius: '6px',
                                        }}
                                    >
                                        {recoveryCodes.map((code) => (
                                            <code key={code}>{code}</code>
                                        ))}
                                    </div>

                                    <button
                                        className="secondary-button"
                                        style={{ marginTop: '16px' }}
                                        onClick={() =>
                                            navigator.clipboard.writeText(
                                                recoveryCodes.join('\n'),
                                            )
                                        }
                                    >
                                        Copy recovery codes
                                    </button>

                                    <div style={dialogActionsStyle}>
                                        <button
                                            className="primary-button"
                                            onClick={() => {
                                                setElevationCode('')
                                                setElevationError('')
                                                setAdminAuthStep('elevate')
                                            }}
                                        >
                                            I've saved my codes
                                        </button>
                                    </div>
                                </>
                            )}

                            {adminAuthStep === 'elevate' && (
                                <>
                                    <h2 id="elevation-title">
                                        Administrator verification
                                    </h2>

                                    <p>
                                        Enter your authenticator code or an unused
                                        recovery code to access the administration panel.
                                    </p>

                                    <form onSubmit={handleAdminElevation}>
                                        <label htmlFor="elevation-code" style={fieldLabelStyle}>
                                            Authentication code
                                        </label>

                                        <input
                                            id="elevation-code"
                                            type="text"
                                            value={elevationCode}
                                            onChange={(event) =>
                                                setElevationCode(event.target.value)
                                            }
                                            placeholder="123456"
                                            autoComplete="one-time-code"
                                            autoFocus
                                            disabled={elevationLoading}
                                            style={codeInputStyle}
                                        />

                                        {elevationError && (
                                            <div className="error-banner" role="alert">
                                                {elevationError}
                                            </div>
                                        )}

                                        <div style={dialogActionsStyle}>
                                            <button
                                                type="button"
                                                className="secondary-button"
                                                disabled={elevationLoading}
                                                onClick={() => {
                                                    setElevationDialogOpen(false)
                                                    setElevationCode('')
                                                    setElevationError('')
                                                }}
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="submit"
                                                className="primary-button"
                                                disabled={elevationLoading || !elevationCode.trim()}
                                            >
                                                {elevationLoading ? 'Verifying...' : 'Continue'}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </section>

                    </div>
                )}
            </>
        )
    }

    return (
        <div className="app-shell">
            <Sidebar
                currentPage={page}
                onPageChange={setPage}
            />

            <main className="main-area">
                <header className="topbar">
                    <div className="breadcrumb">
                        Administration
                        <span>/</span>
                        {page.charAt(0).toUpperCase() + page.slice(1)}
                    </div>

                    <div className="topbar-actions">
                        <button
                            className="secondary-button"
                            onClick={() => setAdminView(false)}
                        >
                            <ArrowLeft size={15} />
                            Back to Mail
                        </button>

                        <button
                            className="icon-button"
                            title="Refresh users"
                            onClick={() =>
                                refreshUsers().catch((error) =>
                                    setError(error.message),
                                )
                            }
                        >
                            <RefreshCw size={17} />
                        </button>

                        <div className="domain-select">
                            <select
                                value={selectedDomain}
                                onChange={(event) =>
                                    setSelectedDomain(event.target.value)
                                }
                                disabled={domains.length === 0}
                            >
                                {domains.map((domain) => (
                                    <option key={domain} value={domain}>
                                        {domain}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="icon-button"
                            title="Sign out"
                            onClick={handleLogout}
                        >
                            <LogOut size={17} />
                        </button>
                    </div>
                </header>

                <div className="content">
                    {error && (
                        <div className="error-banner">
                            <span>{error}</span>
                            <button onClick={() => setError('')}>
                                Dismiss
                            </button>
                        </div>
                    )}

                    {adminLoading ? (
                        <div className="loading-state">
                            Loading administration data...
                        </div>
                    ) : (
                        renderAdminPage()
                    )}
                </div>
            </main>
        </div>
    )
}

const dialogOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'rgba(0, 0, 0, 0.6)',
}

const dialogStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '420px',
    padding: '28px',
    borderRadius: '12px',
    background: 'var(--panel-background, #1e1e1e)',
    color: 'var(--text-color, #fff)',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.35)',
}

const fieldLabelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 600,
}

const codeInputStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    width: '100%',
    padding: '12px',
    border: '1px solid var(--border-color, #555)',
    borderRadius: '6px',
    background: 'var(--input-background, #111)',
    color: 'inherit',
    fontSize: '16px',
}

const dialogActionsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
}

export default App
