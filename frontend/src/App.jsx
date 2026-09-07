import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { getRoleAccess } from './constants/roles'

// Chargement paresseux (lazy) des pages : chaque page n'est téléchargée
// que lorsqu'on la visite → le bundle initial est beaucoup plus léger.
const Login = lazy(() => import('./pages/auth/Login'))
const MainLayout = lazy(() => import('./layouts/MainLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminDemandes = lazy(() => import('./pages/admin/AdminDemandes'))
const AdminBonsCommande = lazy(() => import('./pages/admin/AdminBonsCommande'))
const AdminProduits = lazy(() => import('./pages/admin/AdminProduits'))
const AdminFournisseurs = lazy(() => import('./pages/admin/AdminFournisseurs'))
const PurchaseRequestList = lazy(() => import('./pages/purchases/PurchaseRequestList'))
const PurchaseRequest = lazy(() => import('./pages/purchases/PurchaseRequest'))
const FicheDemande = lazy(() => import('./pages/purchases/FicheDemande'))
const PurchaseOrderList = lazy(() => import('./pages/purchases/PurchaseOrderList'))
const PurchaseOrder = lazy(() => import('./pages/purchases/PurchaseOrder'))
const Regroupement = lazy(() => import('./pages/purchases/Regroupement'))
const DemandesApprouvees = lazy(() => import('./pages/purchases/DemandesApprouvees'))
const Profile = lazy(() => import('./pages/Profile'))
import FicheBonCommande from './pages/purchases/FicheBonCommande'


function HomeRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  const home = getRoleAccess(user.role).home || '/login'
  return <Navigate to={home} replace />
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <div
          className="mx-auto mb-3 w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#007a33' }}
        />
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
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
          </Route>
        </Routes>
        </Suspense>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
