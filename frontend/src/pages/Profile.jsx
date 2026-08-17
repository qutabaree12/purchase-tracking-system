import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLayout } from '../context/LayoutContext'

const roleLabels = {
  admin: 'Administrateur',
  'chef département': 'Chef de département',
  demandeur: 'Demandeur',
  acheteur: 'Acheteur',
  transitaire: 'Transitaire',
  directeur: 'Directeur',
}

export default function Profile() {
  const { user, logout } = useAuth()
  const { setTitle, setSubtitle, setActions } = useLayout()
  const navigate = useNavigate()

  useEffect(() => {
    setTitle('Mon profil')
    setSubtitle('Consultez les informations de votre compte.')
    setActions(null)

    return () => {
      setTitle('')
      setSubtitle('')
      setActions(null)
    }
  }, [setTitle, setSubtitle, setActions])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="card">
        <div className="card-body text-center py-10">
          <p className="text-gray-500">
            Aucun utilisateur connecté.
          </p>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn-primary mt-4"
          >
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  const fullName = user.full_name || 'Utilisateur'
  const role = roleLabels[user.role] || user.role || 'Non défini'

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">
          Mon profil
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Consultez les informations de votre compte.
        </p>
      </div>

      {/* Carte principale */}
      <div className="card">
        <div className="card-body">

          {/* Identité */}
          <div className="flex items-center gap-5 pb-6 border-b border-gray-200">

            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold text-white shrink-0"
              style={{ backgroundColor: '#007a33' }}
            >
              {initials || 'U'}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {fullName}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {role}
              </p>
            </div>

          </div>

          {/* Informations personnelles */}
          <div className="pt-6">

            <h3 className="text-lg font-semibold text-brand-navy mb-4">
              Informations personnelles
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">
                  Nom complet
                </p>

                <p className="font-medium text-gray-900">
                  {user.full_name || '—'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">
                  Email
                </p>

                <p className="font-medium text-gray-900">
                  {user.email || '—'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">
                  Téléphone
                </p>

                <p className="font-medium text-gray-900">
                  {user.phone || user.telephone || '—'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">
                  Rôle
                </p>

                <p className="font-medium text-gray-900">
                  {role}
                </p>
              </div>

            </div>

          </div>

          {/* Rôle et accès */}
          <div className="pt-6">

            <h3 className="text-lg font-semibold text-brand-navy mb-4">
              Rôle et accès
            </h3>

            <div className="p-4 border border-gray-200 rounded-lg">

              <div className="flex items-center justify-between gap-4">

                <div>
                  <p className="font-medium text-gray-900">
                    {role}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Les fonctionnalités accessibles dépendent de votre rôle
                    dans le processus d'achat.
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {user.is_active === false ? 'Inactif' : 'Actif'}
                </span>

              </div>

            </div>

          </div>

          {/* Déconnexion */}
          <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">

            <button
              type="button"
              onClick={handleLogout}
              className="btn-danger"
            >
              Se déconnecter
            </button>

          </div>

        </div>
      </div>

    </div>
  )
}

