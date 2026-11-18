interface DashboardProps {
    domains: string[]
    selectedDomain: string
    users: User[]
}

export default function Dashboard({
                                      domains,
                                      selectedDomain,
                                      users,
                                  }: DashboardProps) {
    return (
        <div className="dashboard">
            <h1>Dashboard</h1>

            <div className="stats-grid">
                <div className="stat-card">
                    <span>Domains</span>
                    <h2>{domains.length}</h2>
                </div>

                <div className="stat-card">
                    <span>Total users</span>
                    <h2>{users.length}</h2>
                </div>

                <div className="stat-card">
                    <span>Enabled users</span>
                    <h2>{users.filter(user => user.enabled).length}</h2>
                </div>

                <div className="stat-card">
                    <span>Messages</span>
                    <h2>0</h2>
                </div>
            </div>

            <div className="content-card">
                <h2>Selected domain</h2>
                <p>{selectedDomain || 'No domain selected'}</p>
            </div>
        </div>
    )
}