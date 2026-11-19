import { useCallback, useEffect, useState } from 'react'
import {
    getUsers,
    createUser,
    updateUserRole,
    resetUserMfa,
    deleteUser,
} from '../api/admin'

import type { AdminUser } from '../api/admin'
import '../styles/Admin.css'

export default function Admin() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [creating, setCreating] = useState(false)

    const loadUsers = useCallback(async () => {
        try {
            setError('')
            const result = await getUsers()
            setUsers(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load users.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadUsers()
    }, [loadUsers])

    async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setCreating(true)
        setError('')
        setMessage('')

        try {
            await createUser(username, password)
            setUsername('')
            setPassword('')
            setMessage('User created successfully.')
            await loadUsers()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not create user.')
        } finally {
            setCreating(false)
        }
    }

    async function handleRoleChange(user: AdminUser, role: 'user' | 'admin') {
        if (user.role === role) return

        setError('')
        setMessage('')

        try {
            await updateUserRole(user.id, role)
            setMessage(`Updated ${user.username}'s role.`)
            await loadUsers()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not update role.')
        }
    }

    async function handleMfaReset(user: AdminUser) {
        if (!window.confirm(`Reset MFA for ${user.username}? They will need to enroll again.`)) {
            return
        }

        setError('')
        setMessage('')

        try {
            await resetUserMfa(user.id)
            setMessage(`MFA reset for ${user.username}. Their existing sessions were revoked.`)
            await loadUsers()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not reset MFA.')
        }
    }

    async function handleDelete(user: AdminUser) {
        if (!window.confirm(`Permanently delete ${user.username}? This cannot be undone.`)) {
            return
        }

        setError('')
        setMessage('')

        try {
            await deleteUser(user.id)
            setMessage(`Deleted ${user.username}.`)
            await loadUsers()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not delete user.')
        }
    }

    return (
        <main className="AdminPage">
            <header className="AdminHeader">
                <div>
                    <h1>Administration</h1>
                    <p>Manage LoyalMail accounts and permissions.</p>
                </div>

                <button onClick={() => void loadUsers()} className="AdminRefresh">
                    Refresh
                </button>
            </header>

            {error && <div className="AdminNotice AdminError">{error}</div>}
            {message && <div className="AdminNotice AdminSuccess">{message}</div>}

            <section className="AdminSection">
                <h2>Create account</h2>
                <p className="AdminDescription">
                    New users will be required to configure MFA when they sign in.
                </p>

                <form className="AdminCreateForm" onSubmit={handleCreateUser}>
                    <label>
                        Username
                        <input
                            value={username}
                            onChange={event => setUsername(event.target.value)}
                            minLength={3}
                            maxLength={64}
                            required
                            autoComplete="off"
                        />
                    </label>

                    <label>
                        Temporary password
                        <input
                            type="password"
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                            minLength={12}
                            required
                            autoComplete="new-password"
                        />
                    </label>

                    <button type="submit" disabled={creating}>
                        {creating ? 'Creating...' : 'Create account'}
                    </button>
                </form>
            </section>

            <section className="AdminSection">
                <div className="AdminSectionHeader">
                    <div>
                        <h2>Users</h2>
                        <p className="AdminDescription">
                            {users.length} registered account{users.length === 1 ? '' : 's'}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <p>Loading users...</p>
                ) : users.length === 0 ? (
                    <p>No users found.</p>
                ) : (
                    <div className="AdminTableWrapper">
                        <table className="AdminTable">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                            </thead>

                            <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>
                      <span className={`AdminRole AdminRole-${user.role}`}>
                        {user.role}
                      </span>
                                    </td>
                                    <td>
                                        <div className="AdminActions">
                                            <select
                                                value={user.role}
                                                onChange={event =>
                                                    void handleRoleChange(
                                                        user,
                                                        event.target.value as 'user' | 'admin',
                                                    )
                                                }
                                                aria-label={`Change ${user.username}'s role`}
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Administrator</option>
                                            </select>

                                            <button
                                                className="AdminSecondary"
                                                onClick={() => void handleMfaReset(user)}
                                            >
                                                Reset MFA
                                            </button>

                                            <button
                                                className="AdminDanger"
                                                onClick={() => void handleDelete(user)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    )
}