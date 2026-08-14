import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutProvider } from '../context/LayoutContext'
import { useAuth } from '../context/AuthContext'
import { getRoleAccess, isPathAllowed } from '../constants/roles'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

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
      <div className="min-h-screen bg-brand-page">
        <Sidebar />
        <div className="ml-[230px] flex flex-col min-h-screen">
          <TopBar />
          <main className="flex-1 p-6 overflow-y-auto" style={{ padding: '20px 24px' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </LayoutProvider>
  )
}
