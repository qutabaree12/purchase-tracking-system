import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { getRoleAccess } from './constants/roles'
import MainLayout from './layouts/MainLayout'
import Login from './pages/auth/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSettings from './pages/admin/AdminSettings'
import AdminDemandes from './pages/admin/AdminDemandes'
import AdminBonsCommande from './pages/admin/AdminBonsCommande'
import AdminProduits from './pages/admin/AdminProduits'
import AdminFournisseurs from './pages/admin/AdminFournisseurs'
import PurchaseRequestList from './pages/purchases/PurchaseRequestList'
import PurchaseRequest from './pages/purchases/PurchaseRequest'
import FicheDemande from './pages/purchases/FicheDemande'
import PurchaseOrderList from './pages/purchases/PurchaseOrderList'
import PurchaseOrder from './pages/purchases/PurchaseOrder'
import Regroupement from './pages/purchases/Regroupement'
import DemandesApprouvees from './pages/purchases/DemandesApprouvees'
import Profile from './pages/Profile'
import FicheBonCommande from './pages/purchases/FicheBonCommande'


function HomeRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  const home = getRoleAccess(user.role).home || '/login'
  return <Navigate to={home} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/settings" element={<AdminSettings />} />
            <Route path="admin/demandes" element={<AdminDemandes />} />
            <Route path="admin/bons-commande" element={<AdminBonsCommande />} />
            <Route path="admin/produits" element={<AdminProduits />} />
            <Route path="admin/fournisseurs" element={<AdminFournisseurs />} />
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
            <Route path="purchases/order/:id/fiche" element={<FicheBonCommande />} />          </Route>
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
