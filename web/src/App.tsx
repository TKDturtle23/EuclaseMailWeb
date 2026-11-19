import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    Outlet,
} from 'react-router-dom'

import { AuthProvider, useAuth } from './contexts/AuthContext'

import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Mfa from './pages/Mfa'
import MfaSetup from './pages/MfaSetup'
import Dashboard from './pages/Dashboard'

import './styles/global.css'

function SetupRoute() {
    const { user, loading } = useAuth()

    if (loading) return <div>Loading...</div>
    if (!user) return <Navigate to="/login" replace />
    if (user.mfa_enabled) {
        return <Navigate to={user.mfa_verified ? '/dash' : '/mfa'} replace />
    }

    return <MfaSetup />
}

function MfaRoute() {
    const { user, loading } = useAuth()

    if (loading) return <div>Loading...</div>
    if (!user) return <Navigate to="/login" replace />
    if (!user.mfa_enabled) return <Navigate to="/mfa-setup" replace />
    if (user.mfa_verified) return <Navigate to="/dash" replace />

    return <Mfa />
}

function AppRoutes() {
    const { user, loading } = useAuth()

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    loading ? <div>Loading...</div> :
                        user ? (
                            <Navigate
                                to={
                                    !user.mfa_enabled
                                        ? '/mfa-setup'
                                        : !user.mfa_verified
                                            ? '/mfa'
                                            : '/dash'
                                }
                                replace
                            />
                        ) : <Login />
                }
            />

            <Route path="/mfa-setup" element={<SetupRoute />} />
            <Route path="/mfa" element={<MfaRoute />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                    <Route path="/dash" element={<Dashboard />} />
                    <Route path="/inbox" element={<div>Inbox</div>} />
                    <Route path="/settings" element={<div>Settings</div>} />
                </Route>
            </Route>

            <Route
                path="/"
                element={<Navigate to={user ? '/dash' : '/login'} replace />}
            />

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    )
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App