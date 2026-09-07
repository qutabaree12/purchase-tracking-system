import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutProvider, useLayout } from '../context/LayoutContext'
import { useAuth } from '../context/AuthContext'
import { getRoleAccess, isPathAllowed } from '../constants/roles'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

function LayoutContent() {
  const { sidebarOpen } = useLayout()

  return (
    <div className="h-screen overflow-hidden bg-brand-page">
      <Sidebar />

      <div
        className={`
          flex flex-col h-full
          transition-[margin] duration-300 ease-in-out
          ${sidebarOpen ? 'md:ml-[208px]' : 'md:ml-0'}
        `}
      >
        <TopBar />

        {/* Seul ce bloc défile : la barre du haut et le menu restent fixes */}
        <main
          className="flex-1 min-h-0 overflow-y-auto p-6 ml-2 mr-2"
          style={{ padding: '20px 24px 20px 12px' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }

    if (!isPathAllowed(user?.role, location.pathname)) {
      navigate(getRoleAccess(user?.role).home, { replace: true })
    }
  }, [isAuthenticated, user, loading, location.pathname, navigate])

  if (loading || !isAuthenticated) return null

  return (
    <LayoutProvider>
      <LayoutContent />
    </LayoutProvider>
  )
}