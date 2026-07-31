import { Outlet } from 'react-router-dom'
import { LayoutProvider } from '../context/LayoutContext'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function MainLayout() {
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
