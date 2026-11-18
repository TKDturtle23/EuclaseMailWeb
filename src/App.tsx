
import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, RefreshCw } from 'lucide-react'

import { api, type User } from './api/client'
import Sidebar, { type Page } from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import UsersPage from './pages/Users'

import './App.css'

function App() {
    const [page, setPage] = useState<Page>('dashboard')
    const [domains, setDomains] = useState<string[]>([])
    const [selectedDomain, setSelectedDomain] = useState('')
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const refreshUsers = useCallback(async () => {
        if (!selectedDomain) return

        const result = await api.getUsers(selectedDomain)
        setUsers(result)
    }, [selectedDomain])

    useEffect(() => {
        async function initialize() {
            try {
                setLoading(true)
                setError('')

                const result = await api.getDomains()
                setDomains(result)

                if (result.length > 0) {
                    setSelectedDomain(result[0])
                }
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to connect to LoyalMailServer',
                )
            } finally {
                setLoading(false)
            }
        }

        initialize()
    }, [])

    useEffect(() => {
        if (!selectedDomain) {
            setUsers([])
            return
        }

        let active = true

        async function loadUsers() {
            try {
                setError('')
                const result = await api.getUsers(selectedDomain)

                if (active) {
                    setUsers(result)
                }
            } catch (error) {
                if (active) {
                    setError(
                        error instanceof Error ? error.message : 'Failed to load users',
                    )
                }
            }
        }

        loadUsers()

        return () => {
            active = false
        }
    }, [selectedDomain])

    function renderPage() {
        if (!selectedDomain && !loading) {
            return (
                <section className="panel">
                    <h2>No domains registered</h2>
                    <p>Register a domain with LoyalMailServer before managing accounts.</p>
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

    return (
        <div className="app-shell">
            <Sidebar
                currentPage={page}
                onPageChange={setPage}
            />

            <main className="main-area">
                <header className="topbar">
                    <div className="breadcrumb">
                        Administration <span>/</span>{' '}
                        {page.charAt(0).toUpperCase() + page.slice(1)}
                    </div>

                    <div className="topbar-actions">
                        <button
                            className="icon-button"
                            title="Refresh users"
                            onClick={() => refreshUsers().catch((error) => setError(error.message))}
                        >
                            <RefreshCw size={17} />
                        </button>

                        <div className="domain-select">
                            <select
                                value={selectedDomain}
                                onChange={(event) => setSelectedDomain(event.target.value)}
                                disabled={domains.length === 0}
                            >
                                {domains.map((domain) => (
                                    <option key={domain} value={domain}>
                                        {domain}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={15} />
                        </div>
                    </div>
                </header>

                <div className="content">
                    {error && (
                        <div className="error-banner">
                            <span>{error}</span>
                            <button onClick={() => setError('')}>Dismiss</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-state">Connecting to LoyalMailServer...</div>
                    ) : (
                        renderPage()
                    )}
                </div>
            </main>
        </div>
    )
}

export default App
