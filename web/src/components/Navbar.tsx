
import { useNavigate } from 'react-router-dom'
import './navbar.css'

function Navbar() {
    const navigate = useNavigate()

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
            </div>
        </nav>
    )
}

export default Navbar
