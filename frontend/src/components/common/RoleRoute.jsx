import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * RoleRoute
 * =========
 * Composant pour protéger les routes en fonction du rôle de l'utilisateur.
 *
 * Exemple :
 *   <Route
 *     path="/purchases/request/new"
 *     element={
 *       <RoleRoute allowedRoles={[ROLES.DEMANDEUR]}>
 *         <PurchaseRequest />
 *       </RoleRoute>
 *     }
 *   />
 */
export default function RoleRoute({ allowedRoles, children }) {
  const { user, isAuthenticated } = useAuth()

  // Pas connecté → redirection login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Rôle non autorisé → redirection dashboard
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/admin" replace />
  }

  // Accès autorisé
  return children
}
