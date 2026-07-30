import { NavLink } from 'react-router-dom'

const navigation = [
  { name: 'Tableau de bord', path: '/admin', icon: '📊' },
  { name: 'Demandes d\'achat', path: '/purchases/requests', icon: '📝' },
  { name: 'Bons de commande', path: '/purchases/orders', icon: '📋' },
  { name: 'Utilisateurs', path: '/admin/users', icon: '👤' },
  { name: 'Paramètres', path: '/admin/settings', icon: '⚙️' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-lg font-bold text-primary-700">Algérie Telecom</h1>
        <p className="text-xs text-gray-500 mt-1">Suivi des Achats</p>
      </div>
      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
