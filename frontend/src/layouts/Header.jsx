import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Système de Suivi des Achats</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">{user?.full_name ?? 'Utilisateur'}</span>
          <button onClick={logout} className="btn-secondary text-sm">Déconnexion</button>
        </div>
      </div>
    </header>
  )
}
