import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import useCountUp from '../../hooks/useCountUp'
import StatCard from '../../components/common/StatCard'
import StatusBadge from '../../components/common/StatusBadge'
import { formatDate } from '../../utils/format'
import { etapeSuivi } from '../../utils/suivi'

const JOUR = 86400000

const SLICES = [
  { key: 'en_cours', stat: 'enCours', name: 'En cours', color: '#0EA5E9' },
  { key: 'approuvee', stat: 'approuvees', name: 'Approuvées', color: '#10B981' },
  { key: 'refusee', stat: 'refusees', name: 'Refusées', color: '#F43F5E' },
]

function computeStats(demandes) {
  const count = (s) => demandes.filter((d) => d.statut === s).length
  const enCours = count('en_cours')
  const approuvees = count('approuvee')
  const refusees = count('refusee')
  const traitees = approuvees + refusees

  const delais = demandes
    .filter((d) => d.statut === 'approuvee' && d.date_creation && d.date_approbation)
    .map((d) => (new Date(d.date_approbation) - new Date(d.date_creation)) / JOUR)
    .filter((n) => n >= 0)

  const bcs = demandes.flatMap((d) => d.suivi || [])
  const etapes = bcs.map(etapeSuivi)

  return {
    total: demandes.length,
    enCours,
    approuvees,
    refusees,
    traitees,
    tauxApprobation: traitees ? (approuvees / traitees) * 100 : null,
    tauxTraitement: demandes.length ? (traitees / demandes.length) * 100 : null,
    delaiMoyen: delais.length ? delais.reduce((a, b) => a + b, 0) / delais.length : null,
    bcTotal: bcs.length,
    livrees: etapes.filter((e) => e === 'livre').length,
    enLivraison: etapes.filter((e) => e === 'a_traiter' || e === 'en_cours').length,
  }
}

function lastSixMonths(demandes) {
  const now = new Date()
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      demandes: 0,
    })
  }
  demandes.forEach((dem) => {
    const dt = new Date(dem.date_creation)
    const m = months.find((x) => x.key === `${dt.getFullYear()}-${dt.getMonth()}`)
    if (m) m.demandes += 1
  })
  return months
}

function delaiTexte(jours) {
  if (jours == null) return '—'
  if (jours < 0.5) return 'Le jour même'
  return `${jours.toFixed(1).replace('.', ',')} j`
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      <p className="font-semibold">{label}</p>
      <p>{payload[0].value} demande(s)</p>
    </div>
  )
}

// Anneau de progression animé (SVG, sans cadre autour)
function Ring({ pct, color, label, detail, onClick }) {
  const value = useCountUp(pct ?? 0)
  const R = 26
  const C = 2 * Math.PI * R
  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`-mx-2 flex items-center gap-4 rounded-2xl px-2 py-2 transition-colors ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
    >
      <svg width="68" height="68" viewBox="0 0 68 68" className="shrink-0 -rotate-90">
        <circle cx="34" cy="34" r={R} fill="none" strokeWidth="7" className="stroke-gray-200 dark:stroke-white/10" />
        <circle
          cx="34" cy="34" r={R} fill="none" strokeWidth="7" strokeLinecap="round"
          stroke={color} strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(value, 100) / 100)}
        />
      </svg>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none tabular-nums">{pct == null ? '—' : `${Math.round(value)} %`}</p>
        <p className="mt-1 text-sm text-gray-600">{label}</p>
        <p className="text-xs text-gray-500">{detail}</p>
      </div>
    </div>
  )
}

export default function DemandeurDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { dark } = useTheme()
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get('/demandes/')
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : res.data.results || []
        if (active) setDemandes(items)
      })
      .catch(() => {
        if (active) setError('Impossible de charger vos statistiques.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => computeStats(demandes), [demandes])
  const mensuel = useMemo(() => lastSixMonths(demandes), [demandes])
  const donut = SLICES.map((s) => ({ ...s, value: stats[s.stat] })).filter((s) => s.value > 0)
  const recentes = demandes.slice(0, 5)
  const prenom = (user?.full_name || '').split(' ')[0]

  const axisText = dark ? '#94A3B8' : '#64748b'
  const grid = dark ? 'rgba(51,65,85,0.3)' : 'rgba(100,116,139,0.18)'

  // Ouvre la liste des demandes déjà filtrée sur un statut
  const goList = (filter) => navigate('/purchases/requests', { state: { filter } })

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-3xl bg-gray-200/60 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Bonjour{prenom ? `, ${prenom}` : ''}</h2>
          <p className="text-sm text-gray-500">Voici l'état de vos demandes d'achat.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/purchases/request/new')}>
          + Nouvelle demande
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Rangée 1 : 4 cartes, toutes cliquables */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Mes demandes" value={stats.total} icon="file" tone="blue" delay={0} onClick={() => goList('toutes')} />
        <StatCard label="En cours" value={stats.enCours} icon="clock" tone="sky" delay={60} onClick={() => goList('en_cours')} />
        <StatCard label="Approuvées" value={stats.approuvees} icon="check" tone="emerald" delay={120} onClick={() => goList('approuvee')} />
        <StatCard label="Refusées" value={stats.refusees} icon="x" tone="rose" delay={180} onClick={() => goList('refusee')} />
      </div>

      {/* Rangée 2 : graphique large (3) + performance (2) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="card rounded-3xl lg:col-span-3 overflow-hidden">
          <div className="card-header">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Demandes créées par mois</span>
            <span className="ml-2 text-xs text-gray-400">6 derniers mois</span>
          </div>
          <div className="px-4 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={mensuel} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="demGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: axisText }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: axisText }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: grid }} />
                <Area type="monotone" dataKey="demandes" stroke="#3B82F6" strokeWidth={2.5} fill="url(#demGrad)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card rounded-3xl lg:col-span-2 overflow-hidden">
          <div className="card-header">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Performance</span>
          </div>
          <div className="card-body space-y-3">
            <Ring
              pct={stats.tauxApprobation}
              color="#10B981"
              label="Taux d'approbation"
              detail={stats.traitees ? `${stats.approuvees} sur ${stats.traitees} traitées` : 'Aucune demande traitée'}
            />
            <Ring
              pct={stats.tauxTraitement}
              color="#3B82F6"
              label="Demandes traitées"
              detail={`${stats.traitees} sur ${stats.total}`}
            />
            <Ring
              pct={stats.bcTotal ? (stats.livrees / stats.bcTotal) * 100 : null}
              color="#8B5CF6"
              label="Commandes livrées"
              detail={stats.bcTotal ? `${stats.enLivraison} en cours · voir le suivi` : 'Aucune commande pour le moment'}
              onClick={() => navigate('/purchases/deliveries')}
            />
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
              <span className="text-gray-500">Délai moyen d'approbation</span>
              <span className="font-semibold">{delaiTexte(stats.delaiMoyen)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rangée 3 : donut (2) + dernières demandes (3), inversé pour casser l'alignement */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="card rounded-3xl lg:col-span-2 overflow-hidden">
          <div className="card-header">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Répartition des statuts</span>
          </div>
          <div className="card-body">
            {donut.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">Aucune demande pour le moment.</p>
            ) : (
              <>
                <div className="relative" style={{ height: 190 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donut} dataKey="value" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={3} cornerRadius={6} stroke="none">
                        {donut.map((s) => <Cell key={s.key} fill={s.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{stats.total}</span>
                    <span className="text-xs text-gray-500">demandes</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  {donut.map((s) => (
                    <button key={s.key} type="button" onClick={() => goList(s.key)} className="flex items-center gap-1.5 hover:underline">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name} ({s.value})
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card rounded-3xl lg:col-span-3 overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Dernières demandes</span>
            <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => goList('toutes')}>
              Voir tout
            </button>
          </div>
          {recentes.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">Vous n'avez pas encore créé de demande.</p>
          ) : (
            recentes.map((d) => (
              <div
                key={d.id_da}
                onClick={() => navigate(`/purchases/request/${d.id_da}/fiche`)}
                className="flex items-center justify-between gap-3 px-6 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{d.numero_da} · {d.objet}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(d.date_creation)}</p>
                </div>
                <StatusBadge status={d.statut} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
