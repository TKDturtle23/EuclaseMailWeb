import {
    LayoutDashboard,
    Users,
    Mail,
    Globe,
    Settings,
} from 'lucide-react'

export type Page = 'dashboard' | 'users' | 'mail' | 'domains' | 'settings'

interface SidebarProps {
    currentPage: Page
    onPageChange: (page: Page) => void
}

export default function Sidebar({
                                    currentPage,
                                    onPageChange,
                                }: SidebarProps) {
    const items = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'mail', label: 'Mail', icon: Mail },
        { id: 'domains', label: 'Domains', icon: Globe },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">LoyalMail</div>

            <nav>
                {items.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        className={currentPage === id ? 'nav-item active' : 'nav-item'}
                        onClick={() => onPageChange(id)}
                    >
                        <Icon size={18} />
                        <span>{label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    )
}