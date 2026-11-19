
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './main-layout.css'

function MainLayout() {
    return (
        <div className="App">
            <Navbar />

            <main className="MainContent">
                <Outlet />
            </main>
        </div>
    )
}

export default MainLayout
