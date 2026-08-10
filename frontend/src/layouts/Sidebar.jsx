import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/common/Logo'
import { ROLES } from '../constants/roles'
import { useNavigate } from 'react-router-dom'

const navigation = {
  [ROLES.DEMANDEUR]: [
    {
      name: 'Tableau de bord',
      path: '/admin',
    },
    {
      name: "Demandes d'achat",
      path: '/purchases/requests',
    },
  ],

  [ROLES.ACHETEUR]: [
    {
      name: 'Tableau de bord',
      path: '/admin',
    },
    {
      name: "Demandes d'achat",
      path: '/purchases/requests',
    },
    {
      name: 'Regroupement',
      path: '/purchases/regroupement',
    },
    {
      name: 'Bons de commande',
      path: '/purchases/orders',
    },
  ],

  [ROLES.TRANSITAIRE]: [
    {
      name: 'Tableau de bord',
      path: '/admin',
    },
  ],

  [ROLES.CONTROLEUR]: [
    {
      name: 'Tableau de bord',
      path: '/admin',
    },
  ],

  [ROLES.DIRECTEUR]: [
    {
      name: 'Tableau de bord',
      path: '/admin',
    },
  ],

  [ROLES.ADMIN]: [
    {
      name: 'Tableau de bord',
      path: '/admin',
    },
    {
      name: 'Utilisateurs',
      path: '/admin/users',
    },
    {
      name: 'Paramètres',
      path: '/admin/settings',
    },
  ],
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export default function Sidebar() {
  

  /*
    IMPORTANT :
    menu doit être calculé DANS le composant,
    car user vient de useAuth().
  */

    const { user } = useAuth()
    const navigate = useNavigate()
  
    const menu = navigation[user?.role] || []

  return (
    <aside className="w-[230px] fixed left-0 top-0 h-screen flex flex-col bg-brand-navy text-white z-40">

      {/* LOGO */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
        <Logo className="h-8 w-auto" />

        <div className="leading-tight">
          <p className="text-sm font-semibold">
            Algérie Telecom
          </p>

          <p className="text-[10px] text-white/50 uppercase tracking-wider">
            Suivi des Achats
          </p>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `relative flex items-center justify-between rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
            style={{
              padding: '9px 11px',
            }}
          >
            {({ isActive }) => (
              <>
                <span>{item.name}</span>

                {item.badge > 0 && (
                  <span
                    className="min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{
                      backgroundColor: '#dc3545',
                    }}
                  >
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <span
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-l"
                    style={{
                      backgroundColor: '#007a33',
                    }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}

      </nav>

      {/* USER */}
      <div className="p-3 border-t border-white/10">

      <button
        onClick={() => navigate('/profile')}
        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 text-left"
      >

          {/* Avatar */}
          <span
            className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold text-white"
            style={{
              backgroundColor: '#007a33',
            }}
          >
            {initials(user?.full_name) || 'U'}
          </span>

          {/* Infos */}
          <span className="flex-1 min-w-0">

            <span className="block text-sm font-medium truncate">
              {user?.full_name ?? 'Utilisateur'}
            </span>

            <span className="block text-[11px] text-white/50 truncate capitalize">
              {user?.role ?? '—'}
            </span>

          </span>

          {/* Arrow */}
          <svg
            className="w-4 h-4 text-white/50 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>

        </button>

      </div>

    </aside>
  )
}