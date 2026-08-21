import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLayout } from '../context/LayoutContext'
import { getRoleAccess } from '../constants/roles'
import Logo from '../components/common/Logo'

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function NavIcon({ path }) {
  const props = {
    className: 'w-4 h-4 shrink-0',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    viewBox: '0 0 24 24',
  }

  if (path === '/admin') {
    return (
      <svg {...props}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    )
  }
  if (path === '/admin/users') {
    return (
      <svg {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }
  if (path === '/purchases/approved-requests') {
    return (
      <svg {...props}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    )
  }
  if (path === '/purchases/regroupement') {
    return (
      <svg {...props}>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    )
  }
  if (path === '/purchases/orders') {
    return (
      <svg {...props}>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M9 12h6M9 16h6" />
      </svg>
    )
  }
  return (
    <svg {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

export default function Sidebar() {
  const { user } = useAuth()
  const { sidebarOpen, toggleSidebar } = useLayout()
  const navigate = useNavigate()
  const navigation = getRoleAccess(user?.role).nav

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`
          fixed left-2 top-2 bottom-2 z-40
          w-[230px]
          flex flex-col
          text-white
          bg-[#203090] dark:bg-[#050a18]
          rounded-2xl shadow-2xl
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10 shrink-0">
          <Logo className="h-8 w-auto" />
          <div className="leading-tight min-w-0">
            <p className="text-sm font-semibold truncate">Algérie Telecom</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wider truncate">
              Suivi des Achats
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[rgba(59,130,246,0.15)] text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`
              }
              style={{ padding: '9px 11px' }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r"
                      style={{ backgroundColor: '#3b82f6' }}
                    />
                  )}
                  <NavIcon path={item.path} />
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.badge > 0 && (
                    <span
                      className="min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold text-white"
                      style={{ backgroundColor: '#dc3545' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 text-left"
          >
            <span
              className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold text-white bg-[#007a33] dark:bg-[#00a651]"
            >
              {initials(user?.full_name) || 'U'}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium truncate">
                {user?.full_name ?? 'Utilisateur'}
              </span>
              <span className="block text-[11px] text-white/50 truncate capitalize">
                {user?.role ?? '—'}
              </span>
            </span>
            <svg className="w-4 h-4 text-white/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  )
}
