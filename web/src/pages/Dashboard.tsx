
import { useEffect, useState } from 'react'
import { getServerHealth, type HealthResponse } from '../api/health'
import '../styles/Dashboard.css'
import { useAuth } from '../contexts/AuthContext'
function Dashboard() {
    const [health, setHealth] = useState<HealthResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuth()
    useEffect(() => {
        async function fetchHealth() {
            try {
                const data = await getServerHealth()
                setHealth(data)
                setError(null)
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Connection failed'
                )
            } finally {
                setLoading(false)
            }
        }

        fetchHealth()
    }, [])

    const serverOnline =
        health?.status === 'ok' || health?.status === 'operational'

    return (
        <div className="Dashboard">
            <header className="DashboardHeader">
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome back to LoyalMail.</p>
                </div>
            </header>

            <section className="DashboardSection">
                <h2>Server</h2>

                <div className="DashboardGrid">
                    <div className="DashboardCard">
                        <h3>Server Status</h3>

                        {loading ? (
                            <span>Checking...</span>
                        ) : error ? (
                            <span className="StatusOffline">
                                Offline
                            </span>
                        ) : (
                            <span className={
                                      serverOnline ? 'StatusOnline' : 'StatusOffline'
                                  }>
                                {health?.status}
                            </span>
                        )}

                        {error && (
                            <p className="CardDescription">{error}</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="DashboardSection">
                <h2>Account Information</h2>

                <div className="DashboardGrid">
                    <div className="DashboardCard">
                        <h3>Username</h3>
                        <p>{user?.username ?? 'Unknown'}</p>
                    </div>

                    <div className="DashboardCard">
                        <h3>Email Address</h3>
                        <p>Not loaded</p>
                    </div>

                    <div className="DashboardCard">
                        <h3>Account Created</h3>
                        <p>Not loaded</p>
                    </div>

                    <div className="DashboardCard">
                        <h3>Email Aliases</h3>
                        <p>0</p>
                    </div>
                </div>
            </section>

            <section className="DashboardSection">
                <h2>Mailbox</h2>

                <div className="DashboardGrid">
                    <div className="DashboardCard">
                        <h3>Unread Messages</h3>
                        <p>0</p>
                    </div>

                    <div className="DashboardCard">
                        <h3>Total Messages</h3>
                        <p>0</p>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Dashboard
