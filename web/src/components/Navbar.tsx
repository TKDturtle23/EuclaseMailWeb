import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './navbar.css'

function Navbar() {
    const navigate = useNavigate()
    const { user } = useAuth()

    return (
        <nav className="Navbar">
            <div className="NavbarBrand">
                LoyalMail
            </div>

            <div className="NavbarLinks">
                <button onClick={() => navigate('/dash')}>
                    Dashboard
                </button>

                <button onClick={() => navigate('/inbox')}>
                    Inbox
                </button>

                <button onClick={() => navigate('/settings')}>
                    Settings
                </button>

                {user?.role === 'admin' && (
                    <button onClick={() => navigate('/admin')}>
                        Administration
                    </button>
                )}
            </div>
        </nav>
    )
}

export default Navbar