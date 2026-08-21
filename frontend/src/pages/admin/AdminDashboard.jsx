import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { getMockArriving, getMockApproved, getMockBons } from '../../constants/mockDemandes'

function StatIcon({ type }) {
  const props = {
    className: 'w-4 h-4',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    viewBox: '0 0 24 24',
  }
  switch (type) {
    case 'total':
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
    case 'attente':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    case 'cours':
      return (
        <svg {...props}>
          <path d="M23 4v6h-6" />
          <path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
          <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
        </svg>
      )
    case 'approuvees':
      return (
        <svg {...props}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    case 'rejetees':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" />
        </svg>
      )
  }
}

function StatCard({ label, value, color, icon, iconColor }) {
  return (
    <div
      className="relative bg-white border border-gray-100 shadow-sm overflow-hidden"
      style={{ borderRadius: 12, minHeight: 76 }}
    >
      <div className="px-3 py-3 flex items-center gap-3">
        <div
          className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}26`, color: iconColor || color }}
        >
          <StatIcon type={icon} />
        </div>
        <div className="min-w-0">
          <p className="text-[22px] font-bold leading-none text-gray-900">{value}</p>
          <p className="text-[11px] text-gray-500 mt-1 leading-snug">{label}</p>
        </div>
      </div>
      <div
        className="absolute bottom-0 left-3 h-1 w-[26px] rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    const computeStats = (demandes, bons) => {
      const enCours = demandes.filter((d) => d.statut === 'en_cours')
      return {
        total: demandes.length,
        enAttente: enCours.filter((d) => !d.id_acheteur).length,
        enCours: enCours.length,
        approuvees: demandes.filter((d) => d.statut === 'approuvee').length,
        rejetees: demandes.filter((d) => d.statut === 'refusee').length,
        bonsCommande: bons.length,
      }
    }

    const load = async () => {
      try {
        const [demandesRes, bonsRes] = await Promise.all([
          api.get('/demandes/'),
          api.get('/bons-commande/'),
        ])
        if (!active) return
        if (demandesRes.data.length === 0) {
          setStats(computeStats([...getMockArriving(user), ...getMockApproved(user)], getMockBons()))
          return
        }
        setStats(computeStats(demandesRes.data, bonsRes.data))
      } catch {
        if (!active) return
        setStats(computeStats([...getMockArriving(user), ...getMockApproved(user)], getMockBons()))
        setError('API indisponible — affichage des données de démonstration.')
      }
    }

    load()
    return () => {
      active = false
    }
  }, [user])

  const cards = [
    { label: "Demandes d'achat Total", value: stats?.total ?? 0, color: '#3B82F6', icon: 'total' },
    { label: 'En attente', value: stats?.enAttente ?? 0, color: '#F59E0B', icon: 'attente' },
    { label: 'En cours', value: stats?.enCours ?? 0, color: '#8B5CF6', icon: 'cours' },
    { label: 'Approuvées', value: stats?.approuvees ?? 0, color: '#22C55E', icon: 'approuvees' },
    { label: 'Rejetées', value: stats?.rejetees ?? 0, color: '#EF4444', icon: 'rejetees' },
    { label: 'Bons de commande', value: stats?.bonsCommande ?? 0, color: '#334155', icon: 'bons', iconColor: '#ffffff' },
  ]

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  )
}
