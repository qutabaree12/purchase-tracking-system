import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLayout } from '../context/LayoutContext'

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
  const hit = defaultTitles.find((t) => pathname.startsWith(t.match))
  return hit ? hit.title : ''
}

export default function TopBar() {
  const location = useLocation()
  const { title, subtitle, actions } = useLayout()
  const [notifOpen, setNotifOpen] = useState(false)

  const pageTitle = title || defaultTitleFor(location.pathname)

  return (
    <header className="bg-white border-b border-brand-line shadow-sm px-6 py-4 flex items-center justify-between gap-4"
      style={{ padding: '14px 24px' }}>
      <div className="flex items-center gap-4 min-w-0">
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30"
          aria-label="Ouvrir le menu"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
          <svg
              className="w-6 h-6 text-brand-navy"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
          >
              <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
              />
          </svg>
       </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-brand-navy">{pageTitle}</h1>
          {subtitle && <p className="text-[12px] text-gray-500 mt-0.5">{subtitle}</p>}
          {/*<p className="text-sm text-gray-500 mt-1">
          Création d'une nouvelle demande d'achat
          </p>*/}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
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
