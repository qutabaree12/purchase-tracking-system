import { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const LayoutContext = createContext(null)

export function LayoutProvider({ children }) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [actions, setActions] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const location = useLocation()

  // Reset title/subtitle/actions every time the route changes.
  // This fixes the "sticky title" bug: without this, a page that
  // called setTitle() would leave its title visible on every
  // page visited afterwards.
  useEffect(() => {
    setTitle('')
    setSubtitle('')
    setActions(null)
  }, [location.pathname])

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev)
  }

  return (
    <LayoutContext.Provider
      value={{
        title,
        subtitle,
        actions,
        setTitle,
        setSubtitle,
        setActions,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider')
  }
  return context
}