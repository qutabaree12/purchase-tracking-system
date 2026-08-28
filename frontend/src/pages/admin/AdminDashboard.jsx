import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { getMockArriving, getMockApproved, getMockBons, MOCK_FOURNISSEURS } from '../../constants/mockDemandes'

const SURFACE = '#151E32'
const BORDER = '#1E293B'
const GRID = 'rgba(51,65,85,0.3)'
const TEXT = '#94A3B8'
const BLUE = '#3B82F6'
const GREEN = '#10B981'
const RED = '#EF4444'
const ORANGE = '#F59E0B'
const CYAN = '#06B6D4'
const VIOLET = '#8B5CF6'
const INDIGO = '#6366F1'

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: BORDER, border: `1px solid #334155` }}>
      {label && <p className="font-semibold text-white mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: {Number(p.value).toLocaleString('fr-FR')}
        </p>
      ))}
    </div>
  )
}

function computeStats(demandes, bons, employes, produits, fournisseurs) {
  const total = demandes.length
  const enCours = demandes.filter((d) => d.statut === 'en_cours')
  const enAttente = enCours.filter((d) => !d.id_acheteur).length
  const assignees = enCours.filter((d) => d.id_acheteur).length
  const approuvees = demandes.filter((d) => d.statut === 'approuvee').length
  const rejetees = demandes.filter((d) => d.statut === 'refusee').length

  const monthlyMap = {}
  demandes.forEach((d) => {
    const key = new Date(d.date_creation).toLocaleDateString('fr-FR', { month: 'short' })
    const lignes = d.lignes || []
    const montant = lignes.reduce((s, l) => s + Number(l.qte) * Number(l.prix_unit), 0)
    const quantite = lignes.reduce((s, l) => s + Number(l.qte), 0)
    if (!monthlyMap[key]) monthlyMap[key] = { mois: key, montant: 0, quantite: 0 }
    monthlyMap[key].montant += montant
    monthlyMap[key].quantite += quantite
  })

  const statuts = [
    { name: 'Demandes en cours', value: enCours.length, color: INDIGO },
    { name: 'Demandes en attente', value: enAttente, color: ORANGE },
    { name: 'Bons en cours', value: bons.filter((b) => b.status === 'en cours').length, color: BLUE },
  ]

  const dotMap = {}
  demandes.forEach((d) => {
    const key = d.dot || 'Autres'
    dotMap[key] = (dotMap[key] || 0) + 1
  })

  const now = new Date()
  const ceMois = demandes.filter((d) => {
    const dt = new Date(d.date_creation)
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()
  }).length

  return {
    total,
    ceMois,
    enCours: enCours.length,
    approuvees,
    rejetees,
    assignees,
    bonsCommande: bons.length,
    employes: employes.length,
    produits: produits.length,
    fournisseurs: fournisseurs.length,
    monthly: Object.values(monthlyMap),
    statuts,
    dot: Object.entries(dotMap).map(([name, value]) => ({ name, value })),
  }
}

function KpiIcon({ type }) {
  const p = { className: 'w-4 h-4', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' }
  if (type === 'employes') {
    return (
      <svg {...p}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }
  if (type === 'demandes') {
    return (
      <svg {...p}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    )
  }
  return (
    <svg {...p}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  )
}

function KpiCard({ label, value, color, icon, trend }) {
  return (
    <div className="relative shadow-sm" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, minHeight: 92 }}>
      <div className="absolute top-3 right-3" style={{ color }}>
        <KpiIcon type={icon} />
      </div>
      <div className="px-4 py-3">
        <p className="text-[13px]" style={{ color: TEXT }}>{label}</p>
        <p className="text-[26px] font-bold leading-none mt-2" style={{ color }}>
          {value.toLocaleString('fr-FR')}
        </p>
        {trend && (
          <p className="text-[11px] mt-1" style={{ color: GREEN }}>{trend}</p>
        )}
      </div>
    </div>
  )
}

function ProgressCard({ color, title, value, count, display }) {
  return (
    <div
      className="relative overflow-hidden shadow-sm transition-transform hover:-translate-y-0.5"
      style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14 }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-3">
        <div
          className="flex-none flex items-center justify-center"
          style={{
            width: 46, height: 46, borderRadius: '50%',
            fontSize: 11, fontWeight: 700, color: '#F8FAFC',
            background: `conic-gradient(${color} ${Math.min(100, Math.max(0, value))}%, #334155 0)`,
          }}
        >
          <span
            className="flex items-center justify-center"
            style={{ background: SURFACE, width: 34, height: 34, borderRadius: '50%' }}
          >
            {display}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[16px] font-bold text-white leading-none">{count}</p>
          <p className="text-[12px] mt-1" style={{ color: TEXT }}>{title}</p>
        </div>
      </div>
    </div>
  )
}

function buildMonthly6(monthly) {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('fr-FR', { month: 'short' })
    const match = (monthly || []).find((m) => m.mois === label)
    months.push({ label, montant: match?.montant || 0, quantite: match?.quantite || 0 })
  }
  return months
}

function AreaChartSVG({ data }) {
  const W = 560, H = 140, TOP = 20, BOTTOM = 110
  const n = Math.max(data.length, 1)
  const maxM = Math.max(...data.map((d) => d.montant), 1)
  const maxQ = Math.max(...data.map((d) => d.quantite), 1)

  const points = (vals, maxV) =>
    vals.map((v, i) => {
      const x = n === 1 ? 0 : (i / (n - 1)) * W
      const y = TOP + (1 - v / maxV) * (BOTTOM - TOP)
      return [x, y]
    })

  const linePath = (arr) => arr.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ')
  const areaPath = (arr) => `${linePath(arr)} L${W},${BOTTOM} L0,${BOTTOM} Z`

  const mPts = points(data.map((d) => d.montant), maxM)
  const qPts = points(data.map((d) => d.quantite), maxQ)
  const lastM = mPts.length ? mPts[mPts.length - 1] : [0, TOP]
  const lastQ = qPts.length ? qPts[qPts.length - 1] : [0, TOP]

  return (
    <div>
      <div className="relative" style={{ height: 150 }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
          {[35, 70, 105].map((y) => (
            <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="#334155" strokeOpacity="0.3" strokeWidth="1" />
          ))}
          <path d={areaPath(mPts)} fill="#3B82F6" fillOpacity="0.1" />
          <path d={linePath(mPts)} fill="none" stroke="#3B82F6" strokeWidth="2" />
          <path d={areaPath(qPts)} fill="#10B981" fillOpacity="0.1" />
          <path d={linePath(qPts)} fill="none" stroke="#10B981" strokeWidth="2" />
          <circle cx={lastM[0]} cy={lastM[1]} r="5" fill="#3B82F6" stroke="#0B1120" strokeWidth="2" />
          <circle cx={lastQ[0]} cy={lastQ[1]} r="5" fill="#10B981" stroke="#0B1120" strokeWidth="2" />
        </svg>
      </div>
      <div className="flex justify-between mt-1.5 text-xs" style={{ color: TEXT }}>
        {data.map((d) => <span key={d.label}>{d.label}</span>)}
      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="h-full flex flex-col shadow-sm" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <h2 className="font-semibold text-[15px] text-white">{title}</h2>
      </div>
      <div className="p-4 flex-1 flex flex-col">{children}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      let demandes = []
      let bons = []
      let employes = []
      let produits = []
      let fournisseurs = []
      try {
        const [d, b, u, p, f] = await Promise.all([
          api.get('/demandes/'),
          api.get('/bons-commande/'),
          api.get('/users/'),
          api.get('/produits/'),
          api.get('/fournisseurs/'),
        ])
        demandes = d.data
        bons = b.data
        employes = u.data
        produits = p.data
        fournisseurs = f.data
      } catch {
        if (active) setError('API indisponible — affichage des données de démonstration.')
      }

      if (demandes.length === 0) {
        demandes = [...getMockArriving(user), ...getMockApproved(user)]
        bons = getMockBons()
        if (fournisseurs.length === 0) {
          fournisseurs = Object.keys(MOCK_FOURNISSEURS).map((id) => ({ id_fournisseur: Number(id) }))
        }
      }

      if (active) setStats(computeStats(demandes, bons, employes, produits, fournisseurs))
    }

    load()
    return () => {
      active = false
    }
  }, [user])

  const kpis = stats ? [
    { label: 'Employés Total', value: stats.employes, color: TEXT, icon: 'employes' },
    { label: "Demandes d'achat Total", value: stats.total, color: BLUE, icon: 'demandes', trend: stats.ceMois ? `+${stats.ceMois} ce mois` : undefined },
    { label: 'Bon de Commandes', value: stats.bonsCommande, color: CYAN, icon: 'bons' },
  ] : []

  const progress = stats ? [
    { title: 'Demandes approuvées', color: GREEN, count: stats.approuvees, value: stats.total ? (stats.approuvees / stats.total) * 100 : 0, display: `${Math.round((stats.approuvees / Math.max(stats.total, 1)) * 100)}%` },
    { title: 'Demandes rejetées', color: RED, count: stats.rejetees, value: stats.total ? (stats.rejetees / stats.total) * 100 : 0, display: `${Math.round((stats.rejetees / Math.max(stats.total, 1)) * 100)}%` },
    { title: 'Total Produits', color: CYAN, count: stats.produits, value: 100, display: String(stats.produits) },
    { title: 'Demandes assignées', color: ORANGE, count: stats.assignees, value: stats.enCours ? (stats.assignees / stats.enCours) * 100 : 0, display: `${Math.round((stats.assignees / Math.max(stats.enCours, 1)) * 100)}%` },
    { title: 'Total Fournisseur', color: VIOLET, count: stats.fournisseurs, value: 100, display: String(stats.fournisseurs) },
  ] : []

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* DOT + jauges de progression */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <ChartCard title="Demandes par DOT">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.dot || []}>
                <defs>
                  <linearGradient id="dotGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: TEXT }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: TEXT }} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" name="Demandes" fill="url(#dotGrad)" radius={[6, 6, 0, 0]} label={{ position: 'top', fill: TEXT, fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Jauges de progression (droite, dans un cadre) */}
        <div className="lg:col-span-2">
          <div className="shadow-sm" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h2 className="font-semibold text-[15px] text-white">Performance</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {progress.map((p, i) => (
                <div key={p.title} className={i === progress.length - 1 ? 'col-span-2' : ''}>
                  <ProgressCard {...p} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Montant & Quantité + Anneau */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 h-full">
        <ChartCard title="Montant & Quantité par mois">
          <p className="text-[11.5px] mb-4" style={{ color: TEXT }}>6 derniers mois</p>
          <AreaChartSVG data={stats ? buildMonthly6(stats.monthly) : []} />
        </ChartCard>
        </div>

        <div className="lg:col-span-2 h-full">
          <ChartCard title="Statut des demandes">
            <div className="flex-1 flex flex-col justify-center">
              <div className="relative" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats?.statuts || []} dataKey="value" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={2}>
                      {(stats?.statuts || []).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<DarkTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-bold text-white">Statuts</span>
                  <span className="text-xs" style={{ color: TEXT }}>Répartition</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-[11px]" style={{ color: TEXT }}>
                {(stats?.statuts || []).map((s, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
