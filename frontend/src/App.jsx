import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ROLES } from './constants/roles'
import MainLayout from './layouts/MainLayout'
import Login from './pages/auth/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSettings from './pages/admin/AdminSettings'
import PurchaseRequestList from './pages/purchases/PurchaseRequestList'
import PurchaseRequest from './pages/purchases/PurchaseRequest'
import PurchaseOrderList from './pages/purchases/PurchaseOrderList'
import PurchaseOrder from './pages/purchases/PurchaseOrder'
import Regroupement from './pages/purchases/Regroupement'
import Profile from './pages/Profile'
import RoleRoute from './components/common/RoleRoute'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ===== LOGIN ===== */}
          <Route path="/login" element={<Login />} />

          {/* ===== PROTECTED ROUTES ===== */}
          <Route path="/" element={<MainLayout />}>
            {/* Dashboard */}
            <Route index element={<AdminDashboard />} />
            <Route path="admin" element={<AdminDashboard />} />

            {/* Admin */}
            <Route
              path="admin/users"
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <AdminUsers />
                </RoleRoute>
              }
            />
            <Route
              path="admin/settings"
              element={
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                  <AdminSettings />
                </RoleRoute>
              }
            />

            {/* Demandes d'achat - accessible à DEMANDEUR et ACHETEUR */}
            <Route
              path="purchases/requests"
              element={
                <RoleRoute
                  allowedRoles={[ROLES.DEMANDEUR, ROLES.ACHETEUR]}
                >
                  <PurchaseRequestList />
                </RoleRoute>
              }
            />

            {/* Nouvelle demande - DEMANDEUR only */}
            <Route
              path="purchases/request/new"
              element={
                <RoleRoute allowedRoles={[ROLES.DEMANDEUR]}>
                  <PurchaseRequest />
                </RoleRoute>
              }
            />

            {/* Consulter demande */}
            <Route
              path="purchases/request/:id"
              element={
                <RoleRoute
                  allowedRoles={[ROLES.DEMANDEUR, ROLES.ACHETEUR]}
                >
                  <PurchaseRequest />
                </RoleRoute>
              }
            />

            {/* Bons de commande */}
            <Route
              path="purchases/orders"
              element={
                <RoleRoute
                  allowedRoles={[ROLES.ACHETEUR, ROLES.DIRECTEUR]}
                >
                  <PurchaseOrderList />
                </RoleRoute>
              }
            />

            <Route
              path="purchases/order/new"
              element={
                <RoleRoute allowedRoles={[ROLES.ACHETEUR]}>
                  <PurchaseOrder />
                </RoleRoute>
              }
            />

            <Route
              path="purchases/order/:id"
              element={
                <RoleRoute allowedRoles={[ROLES.ACHETEUR]}>
                  <PurchaseOrder />
                </RoleRoute>
              }
            />

            {/* Regroupement - ACHETEUR only */}
            <Route
              path="purchases/regroupement"
              element={
                <RoleRoute allowedRoles={[ROLES.ACHETEUR]}>
                  <Regroupement />
                </RoleRoute>
              }
            />

            {/* Profile - Tous les utilisateurs */}
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* ===== CATCH-ALL ===== */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
