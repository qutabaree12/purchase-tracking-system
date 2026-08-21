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
    <div className="min-h-screen bg-brand-page">
      <Sidebar />

      <div
        className={`
          flex flex-col min-h-screen
          transition-[margin] duration-300 ease-in-out
          ${sidebarOpen ? 'md:ml-[238px]' : 'md:ml-0'}
        `}
      >
        <TopBar />

        <main
          className="flex-1 p-6 overflow-y-auto ml-2 mr-2"
          style={{ padding: '20px 24px' }}
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