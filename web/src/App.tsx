import { useEffect, useState } from 'react'
import './styles/global.css'

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(250)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!dragging) return

    const handlePointerMove = (e: PointerEvent) => {
      const newWidth = Math.min(500, Math.max(150, e.clientX))
      setSidebarWidth(newWidth)
    }

    const handlePointerUp = () => {
      setDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragging])

  return (
      <div className="app">
        <aside
            className="Sidebar"
            style={{ width: sidebarWidth }}
        >

        </aside>

        <div
            className="ResizeHandle"
            onPointerDown={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
        />

        <main className="MainContent">
          Main content
        </main>
      </div>
  )
}

export default App