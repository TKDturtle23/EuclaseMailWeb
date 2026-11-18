import {useEffect, useState} from 'react'
import {
    Archive,
    FileText,
    Inbox,
    LogOut,
    Mail,
    PenSquare,
    RefreshCw,
    Send,
    Settings,
    Shield,
    Trash2,
} from 'lucide-react'

import {api, type AuthUser, type Mailbox, type Message} from '../api/client'

interface MailExplorerProps {
    user: AuthUser
    onAdmin: () => void
    onLogout: () => void
}

function formatMailboxName(name: string): string {
    if (name.toUpperCase() === 'INBOX') return 'Inbox'

    return name.charAt(0).toUpperCase() + name.slice(1)
}

function getMailboxIcon(name: string) {
    switch (name.toUpperCase()) {
        case 'INBOX':
            return Inbox
        case 'SENT':
            return Send
        case 'DRAFTS':
            return FileText
        case 'ARCHIVE':
            return Archive
        case 'TRASH':
            return Trash2
        default:
            return Mail
    }
}

function formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000)

    if (Number.isNaN(date.getTime())) {
        return 'Unknown date'
    }

    return date.toLocaleString()
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatAddress(value: string): string {
    if (!value.trim()) return 'Unknown'

    return value.replace(/\s+/g, ' ').trim()
}

function MailExplorer({user, onAdmin, onLogout}: MailExplorerProps) {
    const [mailboxes, setMailboxes] = useState<Mailbox[]>([])
    const [selectedMailboxId, setSelectedMailboxId] = useState<number | null>(null)

    const [messages, setMessages] = useState<Message[]>([])
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
    const [messageContent, setMessageContent] = useState<string | null>(null)

    const [mailboxLoading, setMailboxLoading] = useState(true)
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [messageLoading, setMessageLoading] = useState(false)

    const [refreshVersion, setRefreshVersion] = useState(0)
    const [error, setError] = useState('')

    // Load the user's mailboxes and select INBOX by default.
    useEffect(() => {
        let active = true

        async function loadMailboxes() {
            try {
                setMailboxLoading(true)
                setError('')

                const result = await api.getMailboxes()

                if (!active) return

                setMailboxes(result)

                const inbox = result.find(
                    mailbox => mailbox.name.toUpperCase() === 'INBOX',
                )

                setSelectedMailboxId(inbox?.id ?? result[0]?.id ?? null)
            } catch (error) {
                if (active) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : 'Unable to load mailboxes.',
                    )
                }
            } finally {
                if (active) {
                    setMailboxLoading(false)
                }
            }
        }

        loadMailboxes()

        return () => {
            active = false
        }
    }, [])

    // Load messages whenever the selected mailbox changes or is refreshed.
    useEffect(() => {
        let active = true

        setMessages([])
        setSelectedMessageId(null)
        setMessageContent(null)

        if (selectedMailboxId === null) {
            setMessagesLoading(false)
            return
        }

        async function loadMessages() {
            try {
                setMessagesLoading(true)
                setError('')

                const result = await api.getMessages(selectedMailboxId!)

                if (active) {
                    setMessages(result)
                }
            } catch (error) {
                if (active) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : 'Unable to load messages.',
                    )
                }
            } finally {
                if (active) {
                    setMessagesLoading(false)
                }
            }
        }

        loadMessages()

        return () => {
            active = false
        }
    }, [selectedMailboxId, refreshVersion])

    // Load the full raw message when a message is selected.
    useEffect(() => {
        let active = true

        setMessageContent(null)

        if (selectedMailboxId === null || selectedMessageId === null) {
            setMessageLoading(false)
            return
        }

        async function loadMessage() {
            try {
                setMessageLoading(true)
                setError('')

                const result = await api.getMessage(
                    selectedMailboxId!,
                    selectedMessageId!,
                )

                if (active) {
                    setMessageContent(result)
                }
            } catch (error) {
                if (active) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : 'Unable to load this message.',
                    )
                }
            } finally {
                if (active) {
                    setMessageLoading(false)
                }
            }
        }

        loadMessage()

        return () => {
            active = false
        }
    }, [selectedMailboxId, selectedMessageId])

    const selectedMailbox = mailboxes.find(
        mailbox => mailbox.id === selectedMailboxId,
    )

    const selectedMessage = messages.find(
        message => message.id === selectedMessageId,
    )

    return (
        <div className="mail-shell">
            <aside className="mail-sidebar">
                <div className="mail-brand">
                    <div className="mail-brand-icon">
                        <Mail size={21}/>
                    </div>
                    <span>LoyalMail</span>
                </div>

                <button className="primary-button compose-button" disabled>
                    <PenSquare size={16}/>
                    Compose
                </button>

                <div className="mail-nav-label">MAILBOX</div>

                <nav className="mail-navigation">
                    {mailboxLoading ? (
                        <div className="mail-nav-item">
                            Loading mailboxes...
                        </div>
                    ) : (
                        mailboxes.map(mailbox => {
                            const Icon = getMailboxIcon(mailbox.name)

                            return (
                                <button
                                    key={mailbox.id}
                                    className={`mail-nav-item ${
                                        selectedMailboxId === mailbox.id
                                            ? 'active'
                                            : ''
                                    }`}
                                    onClick={() => {
                                        setSelectedMailboxId(mailbox.id)
                                    }}
                                >
                                    <Icon size={17}/>
                                    {formatMailboxName(mailbox.name)}
                                </button>
                            )
                        })
                    )}
                </nav>

                <div className="mail-sidebar-footer">
                    {user.is_admin && (
                        <button className="mail-nav-item" onClick={onAdmin}>
                            <Shield size={17}/>
                            Admin Panel
                        </button>
                    )}

                    <button className="mail-nav-item" disabled>
                        <Settings size={17}/>
                        Settings
                    </button>

                    <div className="mail-account">
                        <div className="mail-avatar">
                            {user.email.charAt(0).toUpperCase()}
                        </div>

                        <div className="mail-account-details">
                            <strong>{user.username || user.email}</strong>
                            <span>{user.email}</span>
                        </div>

                        <button
                            className="icon-button"
                            title="Sign out"
                            onClick={onLogout}
                        >
                            <LogOut size={17}/>
                        </button>
                    </div>
                </div>
            </aside>

            <main className="mail-main">
                <header className="mail-topbar">
                    <div>
                        <h1>
                            {selectedMailbox
                                ? formatMailboxName(selectedMailbox.name)
                                : 'Mail'}
                        </h1>
                        <p>{user.email}</p>
                    </div>

                    <button
                        className="icon-button"
                        title="Refresh messages"
                        disabled={
                            selectedMailboxId === null || messagesLoading
                        }
                        onClick={() => setRefreshVersion(version => version + 1)}
                    >
                        <RefreshCw
                            size={17}
                            className={messagesLoading ? 'spin' : ''}
                        />
                    </button>
                </header>

                <section className="mail-content">
                    {error && (
                        <div className="error-banner" role="alert">
                            {error}
                        </div>
                    )}

                    {selectedMessageId !== null ? (
                        <>
                            <div className="mail-toolbar">
                                <button
                                    className="secondary-button"
                                    onClick={() => {
                                        setSelectedMessageId(null)
                                        setMessageContent(null)
                                    }}
                                >
                                    Back to messages
                                </button>

                                <span className="result-count">
                                    {selectedMessage
                                        ? formatDate(selectedMessage.received_at)
                                        : ''}
                                </span>
                            </div>

                            <div className="mail-message-view">
                                {selectedMessage && (
                                    <div className="mail-message-info">
                                        <h2>
                                            {selectedMessage.subject || '(No subject)'}
                                        </h2>

                                        <strong>
                                            From: {formatAddress(selectedMessage.from)}
                                        </strong>

                                        <span>
                To: {formatAddress(selectedMessage.to)}
            </span>

                                        <span>
                {formatDate(selectedMessage.received_at)}
            </span>

                                        <span>
                {formatSize(selectedMessage.size_bytes)}
            </span>
                                    </div>
                                )}

                                {messageLoading ? (
                                    <div className="loading-state">
                                        Loading message...
                                    </div>
                                ) : messageContent !== null ? (
                                    <pre className="mail-raw-message">
            {messageContent}
        </pre>
                                ) : (
                                    <div className="mail-empty">
                                        <h2>Message unavailable</h2>
                                        <p>
                                            The message could not be loaded.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mail-toolbar">
                                <span>Messages</span>
                                <span className="result-count">
                                    {messagesLoading
                                        ? 'Loading...'
                                        : `${messages.length} messages`}
                                </span>
                            </div>

                            {messagesLoading ? (
                                <div className="loading-state">
                                    Loading messages...
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="mail-empty">
                                    <div className="mail-empty-icon">
                                        <Inbox size={30}/>
                                    </div>

                                    <h2>
                                        {selectedMailbox
                                            ? `${formatMailboxName(selectedMailbox.name)} is empty`
                                            : 'No mailbox selected'}
                                    </h2>

                                    <p>
                                        Messages stored in this mailbox will
                                        appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="mail-message-list">
                                    {messages.map(message => (
                                        <button
                                            key={message.id}
                                            className={`mail-message-item ${
                                                selectedMessageId === message.id
                                                    ? 'active'
                                                    : ''
                                            }`}
                                            onClick={() =>
                                                setSelectedMessageId(message.id)
                                            }
                                        >
                                            <div className="mail-message-info">
                                                <strong>
                                                    {formatAddress(message.from) || 'Unknown sender'}
                                                </strong>

                                                <span>
                                                    {message.subject || '(No subject)'}
                                                </span>

                                                <span>
                                                    To: {formatAddress(message.to)}
                                                </span>

                                                <span>
                                                    {formatDate(message.received_at)}
                                                </span>
                                            </div>

                                            <span className="mail-message-size">
                                                {formatSize(message.size_bytes)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>
            </main>
        </div>
    )
}

export default MailExplorer
