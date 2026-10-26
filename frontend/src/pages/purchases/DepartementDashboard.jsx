import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/common/StatCard'
import { formatDate, formatCurrency } from '../../utils/format'
import { etapeSuivi, TONES } from '../../utils/suivi'

const JOUR = 86400000
const SEUIL_ATTENTION = 3 // jours sans acheteur : à surveiller
const SEUIL_RETARD = 7 // jours sans acheteur : en retard

const SLICES = [
  { key: 'aAssigner', name: 'À assigner', color: '#F43F5E' },
  { key: 'enTraitement', name: 'En traitement', color: '#0EA5E9' },
  { key: 'approuvees', name: 'Approuvées', color: '#10B981' },
  { key: 'refusees', name: 'Refusées', color: '#94A3B8' },
]

const montantDA = (d) =>
  (d.lignes || []).reduce((s, l) => s + Number(l.qte) * Number(l.prix_unit), 0)
const sansAcheteur = (d) => d.statut === 'en_cours' && !d.id_acheteur
const enTraitement = (d) => d.statut === 'en_cours' && !!d.id_acheteur
const ageEnJours = (d) =>
  Math.max(0, Math.floor((Date.now() - new Date(d.date_creation)) / JOUR))
const moyenne = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

function derniersMois() {
  const out = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({
      key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`,
      label: m.toLocaleDateString('fr-FR', { month: 'short' }),
      total: 0,
    })
  }
  return out
}

function computeStats(demandes) {
  const approuvees = demandes.filter((d) => d.statut === 'approuvee')
  const refusees = demandes.filter((d) => d.statut === 'refusee')
  const traitees = approuvees.length + refusees.length

  const delais = demandes
    .filter((d) => d.date_assignation && d.date_creation)
    .map((d) => (new Date(d.date_assignation) - new Date(d.date_creation)) / JOUR)
    .filter((n) => n >= 0)

  const bcs = demandes.flatMap((d) => d.suivi || [])

  const mois = derniersMois()
  demandes.forEach((d) => {
    const m = mois.find((x) => x.key === String(d.date_creation).slice(0, 7))
    if (m) m.total += 1
  })

  const groupes = {}
  demandes.forEach((d) => {
    const k = d.id_demandeur
    if (!groupes[k]) groupes[k] = { nom: d.demandeur_nom, total: 0, montant: 0 }
    groupes[k].total += 1
    if (d.statut !== 'refusee') groupes[k].montant += montantDA(d)
  })
  const parDemandeur = Object.values(groupes).sort((a, b) => b.total - a.total).slice(0, 5)

  return {
    total: demandes.length,
    aAssigner: demandes.filter(sansAcheteur).length,
    enTraitement: demandes.filter(enTraitement).length,
    approuvees: approuvees.length,
    refusees: refusees.length,
    taux: traitees ? (approuvees.length / traitees) * 100 : null,
    delaiAssignation: moyenne(delais),
    enLivraison: bcs.filter((bc) => ['a_traiter', 'en_cours'].includes(etapeSuivi(bc))).length,
    livrees: bcs.filter((bc) => etapeSuivi(bc) === 'livre').length,
    montant: demandes.filter((d) => d.statut !== 'refusee').reduce((s, d) => s + montantDA(d), 0),
    mois,
    parDemandeur,
  }
}

export default function DepartementDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
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
        if (active) setError('Impossible de charger les statistiques du département.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => computeStats(demandes), [demandes])
  const aTraiter = useMemo(
    () =>
      demandes
        .filter(sansAcheteur)
        .sort((a, b) => new Date(a.date_creation) - new Date(b.date_creation)),
    [demandes]
  )
  const donut = SLICES.map((s) => ({ ...s, value: stats[s.key] })).filter((s) => s.value > 0)
  const prenom = (user?.full_name || '').split(' ')[0]

  const versListe = (chefFilter) =>
    navigate('/purchases/requests', { state: { chefFilter } })

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
      <div>
        <h2 className="text-lg font-semibold">Bonjour{prenom ? `, ${prenom}` : ''}</h2>
        <p className="text-sm text-gray-500">Vue d'ensemble des demandes d'achat de votre département.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Demandes du département" value={stats.total} icon="file" tone="blue" delay={0} onClick={() => versListe('toutes')} />
        <StatCard
          label="À assigner"
          value={stats.aAssigner}
          icon="clock"
          tone="rose"
          delay={60}
          hint={stats.aAssigner > 0 ? "Action requise de votre part" : "Tout est assigné"}
          onClick={() => versListe('sans_acheteur')}
        />
        <StatCard label="En traitement" value={stats.enTraitement} icon="box" tone="sky" delay={120} onClick={() => versListe('en_traitement')} />
        <StatCard label="Approuvées" value={stats.approuvees} icon="check" tone="emerald" delay={180} onClick={() => versListe('approuvee')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Délai moyen d'assignation"
          value={stats.delaiAssignation}
          suffix=" j"
          decimals={1}
          icon="clock"
          tone="amber"
          delay={240}
          hint={stats.delaiAssignation == null ? "Aucune demande assignée pour le moment" : "De la création au choix de l'acheteur"}
        />
        <StatCard
          label="Taux d'approbation"
          value={stats.taux}
          suffix=" %"
          icon="trend"
          tone="violet"
          delay={300}
          hint={stats.taux == null ? "Aucune demande traitée pour le moment" : "Sur les demandes déjà traitées"}
        />
        <StatCard
          label="Commandes en livraison"
          value={stats.enLivraison}
          icon="box"
          tone="sky"
          delay={360}
          hint={`${stats.livrees} livrée${stats.livrees > 1 ? 's' : ''}`}
          onClick={() => navigate('/purchases/orders')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="card lg:col-span-3 overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              À assigner en priorité
            </span>
            {aTraiter.length > 0 && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: 13 }}
                onClick={() => versListe('sans_acheteur')}
              >
                Tout voir ({aTraiter.length})
              </button>
            )}
          </div>
          {aTraiter.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">
              Toutes les demandes de votre département ont un acheteur.
            </p>
          ) : (
            aTraiter.slice(0, 5).map((d) => {
              const age = ageEnJours(d)
              const ton = age >= SEUIL_RETARD ? TONES.rouge : age >= SEUIL_ATTENTION ? TONES.orange : TONES.gris
              return (
                <div
                  key={d.id_da}
                  onClick={() => navigate(`/purchases/request/${d.id_da}/fiche`)}
                  className="flex items-center justify-between gap-3 px-6 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{d.numero_da} · {d.objet}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {d.demandeur_nom} · créée le {formatDate(d.date_creation)}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ton}`}>
                    {age === 0 ? "Aujourd'hui" : `${age} j sans acheteur`}
                  </span>
                </div>
              )
            })
          )}
        </div>

        <div className="card lg:col-span-2 overflow-hidden">
          <div className="card-header">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Répartition</span>
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
                    <span key={s.key} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name} ({s.value})
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="card lg:col-span-3 overflow-hidden">
          <div className="card-header">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Demandes créées par mois <span className="normal-case font-normal">· 6 derniers mois</span>
            </span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.mois}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="total" name="Demandes" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card lg:col-span-2 overflow-hidden">
          <div className="card-header">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Par demandeur</span>
          </div>
          {stats.parDemandeur.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">Aucune donnée.</p>
          ) : (
            <>
              {stats.parDemandeur.map((p) => (
                <div key={p.nom} className="flex items-center justify-between gap-3 px-6 py-3 border-b border-gray-100">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{p.nom}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.total} demande{p.total > 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm text-gray-700 shrink-0">{formatCurrency(p.montant)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-6 py-3 text-sm">
                <span className="text-gray-500">Total demandé (hors refus)</span>
                <span className="font-semibold">{formatCurrency(stats.montant)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
