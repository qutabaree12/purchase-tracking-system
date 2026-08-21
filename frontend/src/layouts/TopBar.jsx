import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLayout } from '../context/LayoutContext'
import { useTheme } from '../context/ThemeContext'

const defaultTitles = [
  { match: '/admin/users', title: 'Utilisateurs' },
  { match: '/admin/settings', title: 'Paramètres' },
  { match: '/admin', title: 'Tableau de bord' },
  { match: '/purchases/regroupement', title: 'Regroupement des demandes' },
  { match: '/purchases/approved-requests', title: 'Demandes Approuvées' },
  { match: '/purchases/request/new', title: "Nouvelle demande d'achat" },
  { match: '/purchases/requests', title: "Demandes d'achat" },
  { match: '/purchases/order/new', title: 'Nouveau bon de commande' },
  { match: '/purchases/orders', title: 'Bons de commande' },
]

function defaultTitleFor(pathname) {
  if (pathname.includes('/fiche')) return "Fiche Demande d'Achat"
  if (/^\/purchases\/request\/\d+$/.test(pathname)) return "Demande d'achat"
  const hit = defaultTitles.find((t) => pathname.startsWith(t.match))
  return hit ? hit.title : ''
}

function ThemeToggle() {
  const { dark, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Basculer le thème"
      title={dark ? 'Passer en mode clair' : 'Passer en mode nuit'}
      className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30"
    >
      {dark ? (
        <svg className="w-5 h-5 text-[#93bbfd]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  )
}

export default function TopBar() {
  const location = useLocation()
  const { title, subtitle, actions, toggleSidebar } = useLayout()
  const [notifOpen, setNotifOpen] = useState(false)

  const pageTitle = defaultTitleFor(location.pathname) || title

  return (
    <header
      className="sticky top-2 z-20 ml-2 mr-2 rounded-2xl bg-white border border-brand-line shadow-sm flex items-center justify-between gap-4"
      style={{ padding: '12px 18px' }}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Hamburger now actually toggles the sidebar, on ALL screen sizes
            (not just mobile like before). */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="shrink-0 p-1.5 rounded-md bg-brand-navy hover:bg-brand-navy/85 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30"
          aria-label="Afficher ou masquer le menu"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Document icon box removed entirely, as requested. */}

        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-brand-navy truncate">
            {pageTitle}
          </h1>
          {subtitle && (
            <p className="text-[12px] text-gray-600 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <ThemeToggle />
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-badge" />
        </div>
        {actions}
      </div>
    </header>
  )
}