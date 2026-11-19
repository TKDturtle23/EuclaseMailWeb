import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute() {
    const { user, loading } = useAuth()

    if (loading) {
        return <div className="AuthLoading">Loading...</div>
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

    return <Outlet />
}