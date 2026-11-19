import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminRoute() {
    const { user, loading } = useAuth()

    if (loading) {
        return <div>Loading...</div>
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (!user.mfa_enabled) {
        return <Navigate to="/mfa-setup" replace />
    }

    if (!user.mfa_verified) {
        return <Navigate to="/mfa" replace />
    }

    if (user.role !== 'admin') {
        return <Navigate to="/dash" replace />
    }

    return <Outlet />
}