
import { useState } from 'react'
import { Plus, Search, Trash2, X, Users as UsersIcon } from 'lucide-react'
import type { User, CreateUserRequest } from '../api/client'
import { api } from '../api/client'

interface UsersProps {
    domain: string
    users: User[]
    onRefresh: () => Promise<void>
}

export default function UsersPage({
                                      domain,
                                      users,
                                      onRefresh,
                                  }: UsersProps) {
    const [search, setSearch] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [localPart, setLocalPart] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const filteredUsers = users.filter((user) =>
        `${user.username} ${user.email}`
            .toLowerCase()
            .includes(search.toLowerCase()),
    )

    async function createUser(event: React.FormEvent) {
        event.preventDefault()
        setSaving(true)
        setError('')

        const request: CreateUserRequest = {
            username,
            password,
            primary_local_part: localPart,
        }

        try {
            await api.createUser(domain, request)
            await onRefresh()

            setUsername('')
            setPassword('')
            setLocalPart('')
            setShowCreate(false)
        } catch (error) {
            setError(
                error instanceof Error ? error.message : 'Failed to create user',
            )
        } finally {
            setSaving(false)
        }
    }

    async function deleteUser(user: User) {
        if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) {
            return
        }

        try {
            await api.deleteUser(domain, user.id)
            await onRefresh()
        } catch (error) {
            window.alert(
                error instanceof Error ? error.message : 'Failed to delete user',
            )
        }
    }

    return (
        <div>
            <div className="page-heading">
                <div>
                    <h1>Users</h1>
                    <p>Manage accounts and email addresses for {domain}.</p>
                </div>

                <button
                    className="primary-button"
                    onClick={() => setShowCreate(true)}
                >
                    <Plus size={17} />
                    Create user
                </button>
            </div>

            <section className="panel">
                <div className="toolbar">
                    <div className="search-box">
                        <Search size={17} />
                        <input
                            placeholder="Search users..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <span className="result-count">
            {filteredUsers.length} accounts
          </span>
                </div>

                <div className="table-wrapper">
                    <table className="user-table">
                        <thead>
                        <tr>
                            <th>ACCOUNT</th>
                            <th>EMAIL ADDRESS</th>
                            <th>STATUS</th>
                            <th>CREATED</th>
                            <th />
                        </tr>
                        </thead>

                        <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <div className="table-account">
                                        <div className="avatar">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{user.username}</span>
                                    </div>
                                </td>

                                <td>{user.email}</td>

                                <td>
                    <span
                        className={`account-status ${
                            user.enabled ? 'enabled' : 'disabled'
                        }`}
                    >
                      {user.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                                </td>

                                <td>
                                    {new Date(user.created_at * 1000).toLocaleDateString()}
                                </td>

                                <td>
                                    <button
                                        className="icon-button danger"
                                        title="Delete user"
                                        onClick={() => deleteUser(user)}
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={5}>
                                    <div className="empty-state">
                                        <UsersIcon size={28} />
                                        <span>No users found.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>

            {showCreate && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowCreate(false)
                        }
                    }}
                >
                    <div className="modal">
                        <div className="modal-heading">
                            <div>
                                <h2>Create user</h2>
                                <p>Add a new email account.</p>
                            </div>

                            <button
                                className="icon-button"
                                onClick={() => setShowCreate(false)}
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form onSubmit={createUser}>
                            <label>
                                Username
                                <input
                                    required
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    placeholder="bob"
                                />
                            </label>

                            <label>
                                Primary email address
                                <div className="email-input">
                                    <input
                                        required
                                        value={localPart}
                                        onChange={(event) => setLocalPart(event.target.value)}
                                        placeholder="bob"
                                    />
                                    <span>@{domain}</span>
                                </div>
                            </label>

                            <label>
                                Password
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Enter a password"
                                />
                            </label>

                            {error && <div className="form-error">{error}</div>}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => setShowCreate(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={saving}
                                >
                                    {saving ? 'Creating...' : 'Create account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
