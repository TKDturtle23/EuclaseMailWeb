import { useCallback, useEffect, useState } from 'react'
import {
    createMailbox,
    getMailboxes,
} from '../api/mailboxes'
import type { Mailbox } from '../api/mailboxes'
import {
    createAlias,
    createDomain,
    deleteAlias,
    getAliases,
    getDomains,
} from '../api/management'
import type { Alias, Domain } from '../api/management'
import '../styles/Mailboxes.css'

export default function Mailboxes() {
    const [mailboxes, setMailboxes] = useState<Mailbox[]>([])
    const [domains, setDomains] = useState<Domain[]>([])
    const [aliases, setAliases] = useState<Alias[]>([])

    const [domainName, setDomainName] = useState('')
    const [mailboxName, setMailboxName] = useState('')
    const [mailboxDomainId, setMailboxDomainId] = useState('')
    const [aliasName, setAliasName] = useState('')
    const [aliasDomainId, setAliasDomainId] = useState('')
    const [aliasMailboxId, setAliasMailboxId] = useState('')

    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const loadData = useCallback(async () => {
        try {
            setError('')

            const [domainResult, mailboxResult, aliasResult] = await Promise.all([
                getDomains(),
                getMailboxes(),
                getAliases(),
            ])

            setDomains(domainResult)
            setMailboxes(mailboxResult)
            setAliases(aliasResult)

            setMailboxDomainId(current =>
                domainResult.some(domain => String(domain.id) === current)
                    ? current
                    : domainResult[0] ? String(domainResult[0].id) : '',
            )

            setAliasDomainId(current =>
                domainResult.some(domain => String(domain.id) === current)
                    ? current
                    : domainResult[0] ? String(domainResult[0].id) : '',
            )

            setAliasMailboxId(current =>
                mailboxResult.some(mailbox => String(mailbox.id) === current)
                    ? current
                    : mailboxResult[0] ? String(mailboxResult[0].id) : '',
            )
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load account data.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadData()
    }, [loadData])

    async function handleCreateDomain(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setCreating(true)
        setError('')
        setMessage('')

        try {
            const domain = await createDomain(domainName.trim())
            setDomains(current => [...current, domain].sort((a, b) => a.name.localeCompare(b.name)))
            setMailboxDomainId(String(domain.id))
            setAliasDomainId(String(domain.id))
            setDomainName('')
            setMessage(`Added ${domain.name}. It still needs to be verified.`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not add domain.')
        } finally {
            setCreating(false)
        }
    }

    async function handleCreateMailbox(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!mailboxDomainId) return

        setCreating(true)
        setError('')
        setMessage('')

        try {
            const mailbox = await createMailbox(
                Number(mailboxDomainId),
                mailboxName.trim().toLowerCase(),
            )

            setMailboxes(current => [...current, mailbox].sort((a, b) => a.address.localeCompare(b.address)))
            setAliasMailboxId(String(mailbox.id))
            setMailboxName('')
            setMessage(`Created ${mailbox.address}.`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not create mailbox.')
        } finally {
            setCreating(false)
        }
    }

    async function handleCreateAlias(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!aliasDomainId || !aliasMailboxId) return

        setCreating(true)
        setError('')
        setMessage('')

        try {
            const alias = await createAlias(
                Number(aliasDomainId),
                Number(aliasMailboxId),
                aliasName.trim().toLowerCase(),
            )

            setAliases(current => [...current, alias].sort((a, b) => a.address.localeCompare(b.address)))
            setAliasName('')
            setMessage(`${alias.address} now delivers to ${alias.mailbox_address}.`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not create alias.')
        } finally {
            setCreating(false)
        }
    }

    async function handleDeleteAlias(alias: Alias) {
        if (!window.confirm(`Delete ${alias.address}?`)) return

        setError('')
        setMessage('')

        try {
            await deleteAlias(alias.id)
            setAliases(current => current.filter(item => item.id !== alias.id))
            setMessage(`Deleted ${alias.address}.`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not delete alias.')
        }
    }

    return (
        <main className="MailboxesPage">
            <header className="MailboxesHeader">
                <div>
                    <h1>Mailboxes</h1>
                    <p>Manage your domains, email addresses, and aliases.</p>
                </div>

                <button className="MailboxRefresh" onClick={() => void loadData()}>
                    Refresh
                </button>
            </header>

            {error && <div className="MailboxNotice MailboxError">{error}</div>}
            {message && <div className="MailboxNotice MailboxSuccess">{message}</div>}

            <section className="MailboxSection">
                <h2>Domains</h2>
                <p className="MailboxDescription">
                    Add the domains you want to use with LoyalMail.
                </p>

                <form className="MailboxCreateForm" onSubmit={handleCreateDomain}>
                    <label>
                        Domain name
                        <input
                            className="MailboxTextInput"
                            type="text"
                            placeholder="example.com"
                            value={domainName}
                            onChange={event => setDomainName(event.target.value)}
                            maxLength={253}
                            required
                        />
                    </label>

                    <button type="submit" disabled={creating}>
                        Add domain
                    </button>
                </form>

                {loading ? (
                    <p>Loading domains...</p>
                ) : domains.length === 0 ? (
                    <p className="MailboxEmpty">You haven't added any domains yet.</p>
                ) : (
                    <div className="MailboxList">
                        {domains.map(domain => (
                            <div className="MailboxItem" key={domain.id}>
                                <div className="MailboxIcon">D</div>
                                <div className="MailboxInfo">
                                    <strong>{domain.name}</strong>
                                    <span>Domain ID: {domain.id}</span>
                                </div>
                                <span className={`MailboxStatus ${domain.verified ? '' : 'MailboxUnverified'}`}>
                  {domain.verified ? 'Verified' : 'Unverified'}
                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="MailboxSection">
                <h2>Create mailbox</h2>
                <p className="MailboxDescription">
                    A mailbox is an email account that can receive and store messages.
                </p>

                {domains.length === 0 ? (
                    <p className="MailboxEmpty">Add a domain before creating a mailbox.</p>
                ) : (
                    <form className="MailboxCreateForm" onSubmit={handleCreateMailbox}>
                        <label>
                            Email address
                            <div className="MailboxAddressInput">
                                <input
                                    type="text"
                                    placeholder="username"
                                    value={mailboxName}
                                    onChange={event => setMailboxName(event.target.value)}
                                    maxLength={64}
                                    required
                                />
                                <span>@</span>
                                <select
                                    value={mailboxDomainId}
                                    onChange={event => setMailboxDomainId(event.target.value)}
                                >
                                    {domains.map(domain => (
                                        <option key={domain.id} value={domain.id}>{domain.name}</option>
                                    ))}
                                </select>
                            </div>
                        </label>

                        <button type="submit" disabled={creating || !mailboxDomainId}>
                            Create mailbox
                        </button>
                    </form>
                )}

                <div className="MailboxList">
                    {mailboxes.map(mailbox => (
                        <div className="MailboxItem" key={mailbox.id}>
                            <div className="MailboxIcon">@</div>
                            <div className="MailboxInfo">
                                <strong>{mailbox.address}</strong>
                                <span>Mailbox ID: {mailbox.id}</span>
                            </div>
                            <span className="MailboxStatus">Active</span>
                        </div>
                    ))}
                    {!loading && mailboxes.length === 0 && (
                        <p className="MailboxEmpty">You haven't created any mailboxes yet.</p>
                    )}
                </div>
            </section>

            <section className="MailboxSection">
                <h2>Aliases</h2>
                <p className="MailboxDescription">
                    An alias is an additional address that delivers to one of your mailboxes.
                </p>

                {domains.length === 0 || mailboxes.length === 0 ? (
                    <p className="MailboxEmpty">
                        You need at least one domain and one mailbox before creating an alias.
                    </p>
                ) : (
                    <form className="MailboxCreateForm MailboxAliasForm" onSubmit={handleCreateAlias}>
                        <label>
                            Alias address
                            <div className="MailboxAddressInput">
                                <input
                                    type="text"
                                    placeholder="support"
                                    value={aliasName}
                                    onChange={event => setAliasName(event.target.value)}
                                    maxLength={64}
                                    required
                                />
                                <span>@</span>
                                <select
                                    value={aliasDomainId}
                                    onChange={event => setAliasDomainId(event.target.value)}
                                >
                                    {domains.map(domain => (
                                        <option key={domain.id} value={domain.id}>{domain.name}</option>
                                    ))}
                                </select>
                            </div>
                        </label>

                        <label>
                            Deliver to mailbox
                            <select
                                className="MailboxTextInput"
                                value={aliasMailboxId}
                                onChange={event => setAliasMailboxId(event.target.value)}
                            >
                                {mailboxes.map(mailbox => (
                                    <option key={mailbox.id} value={mailbox.id}>
                                        {mailbox.address}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button type="submit" disabled={creating || !aliasDomainId || !aliasMailboxId}>
                            Create alias
                        </button>
                    </form>
                )}

                <div className="MailboxList">
                    {aliases.map(alias => (
                        <div className="MailboxItem" key={alias.id}>
                            <div className="MailboxIcon">↪</div>
                            <div className="MailboxInfo">
                                <strong>{alias.address}</strong>
                                <span>Delivers to {alias.mailbox_address}</span>
                            </div>
                            <button
                                className="MailboxDelete"
                                type="button"
                                onClick={() => void handleDeleteAlias(alias)}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                    {!loading && aliases.length === 0 && (
                        <p className="MailboxEmpty">You haven't created any aliases yet.</p>
                    )}
                </div>
            </section>
        </main>
    )
}