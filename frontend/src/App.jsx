import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import Login from './pages/auth/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSettings from './pages/admin/AdminSettings'
import PurchaseRequestList from './pages/purchases/PurchaseRequestList'
import PurchaseRequest from './pages/purchases/PurchaseRequest'
import PurchaseOrderList from './pages/purchases/PurchaseOrderList'
import PurchaseOrder from './pages/purchases/PurchaseOrder'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/settings" element={<AdminSettings />} />
            <Route path="purchases/requests" element={<PurchaseRequestList />} />
            <Route path="purchases/request/new" element={<PurchaseRequest />} />
            <Route path="purchases/request/:id" element={<PurchaseRequest />} />
            <Route path="purchases/orders" element={<PurchaseOrderList />} />
            <Route path="purchases/order/new" element={<PurchaseOrder />} />
            <Route path="purchases/order/:id" element={<PurchaseOrder />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
