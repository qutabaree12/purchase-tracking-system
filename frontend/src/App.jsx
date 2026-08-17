import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { getRoleAccess } from './constants/roles'
import MainLayout from './layouts/MainLayout'
import Login from './pages/auth/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSettings from './pages/admin/AdminSettings'
import PurchaseRequestList from './pages/purchases/PurchaseRequestList'
import PurchaseRequest from './pages/purchases/PurchaseRequest'
import FicheDemande from './pages/purchases/FicheDemande'
import PurchaseOrderList from './pages/purchases/PurchaseOrderList'
import PurchaseOrder from './pages/purchases/PurchaseOrder'
import Regroupement from './pages/purchases/Regroupement'
import DemandesApprouvees from './pages/purchases/DemandesApprouvees'
import Profile from './pages/Profile'


function HomeRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  const home = getRoleAccess(user.role).home || '/login'
  return <Navigate to={home} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/settings" element={<AdminSettings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="purchases/requests" element={<PurchaseRequestList />} />
            <Route path="purchases/approved-requests" element={<DemandesApprouvees />} />
            <Route path="purchases/request/new" element={<PurchaseRequest />} />
            <Route path="purchases/request/:id" element={<PurchaseRequest />} />
            <Route path="purchases/request/:id/fiche" element={<FicheDemande />} />
            <Route path="purchases/orders" element={<PurchaseOrderList />} />
            <Route path="purchases/order/new" element={<PurchaseOrder />} />
            <Route path="purchases/order/:id" element={<PurchaseOrder />} />
            <Route path="purchases/regroupement" element={<Regroupement />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
