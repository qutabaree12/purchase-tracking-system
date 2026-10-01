import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import StatusBadge from '../../components/common/StatusBadge'
import DataTable from '../../components/common/DataTable'
import { formatDate, modeExpeditionLabel } from '../../utils/format'
import { DOSSIERS } from './DocumentsTransport'

function Kpi({ label, value, tone, onClick }) {
  return (
    <div
      className={`rounded-2xl p-5 ring-1 shadow-sm ${tone} ${onClick ? 'cursor-pointer hover:brightness-95 transition' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      <p className="text-[12px] font-semibold uppercase tracking-wide opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}

const RECENT_COLUMNS = [
  { key: 'bc_reference', header: 'N° BC', sortable: true, render: (d) => d.bc_reference || `BC-${d.id_bc}` },
  { key: 'fournisseur_nom', header: 'Fournisseur', sortable: true, render: (d) => d.fournisseur_nom || '-' },
  { key: 'mode_expedition', header: 'Mode', render: (d) => modeExpeditionLabel(d.mode_expedition) },
  { key: 'statut', header: 'Statut', render: (d) => <StatusBadge status={d.statut} /> },
  {
    key: 'date_livraison_prevue',
    header: 'Livraison prévue',
    sortable: true,
    render: (d) => (d.date_livraison_prevue ? formatDate(d.date_livraison_prevue) : '-'),
  },
]

const DOCUMENTS_MANQUANTS = (() => {
  const list = []
  DOSSIERS.forEach((d) => {
    d.docs.forEach((doc) => {
      if (doc.status === 'manquant') {
        list.push({ nom: doc.nom, bc: d.id, fournisseur: d.fournisseur })
      }
    })
  })
  return list
})()

export default function TransitaireDashboard() {
  const navigate = useNavigate()
  const [dossiers, setDossiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/dossiers-importation/')
        const items = Array.isArray(res.data) ? res.data : res.data.results || []
        if (active) setDossiers(items)
      } catch (err) {
        if (active) {
          setError(err.response?.data?.detail || 'Erreur lors du chargement des dossiers.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const aTraiter = dossiers.filter((d) => d.statut === 'a traiter').length
  const enCours = dossiers.filter((d) => d.statut === 'en cours').length
  const livres = dossiers.filter((d) => d.statut === 'livré').length
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const enRetard = dossiers.filter(
    (d) => d.statut !== 'livré' && d.date_livraison_prevue && new Date(d.date_livraison_prevue) < now
  ).length

  const recents = dossiers
    .filter((d) => d.statut !== 'livré')
    .sort((a, b) => new Date(a.date_livraison_prevue || 0) - new Date(b.date_livraison_prevue || 0))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="À traiter" value={aTraiter} tone="bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25" onClick={() => navigate('/purchases/dossiers', { state: { filter: 'a traiter' } })} />
        <Kpi label="En cours" value={enCours} tone="bg-blue-500/10 text-blue-700 ring-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25" onClick={() => navigate('/purchases/dossiers', { state: { filter: 'en cours' } })} />
        <Kpi label="Livrés" value={livres} tone="bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25" onClick={() => navigate('/purchases/dossiers', { state: { filter: 'livré' } })} />
        <Kpi label="En retard" value={enRetard} tone="bg-rose-500/10 text-rose-700 ring-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25" onClick={() => navigate('/purchases/dossiers', { state: { filter: 'en_retard' } })} />
      </div>

      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Dossiers récents
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: 13 }}
            onClick={() => navigate('/purchases/dossiers')}
          >
            Voir tout
          </button>
        </div>
        <DataTable
          columns={RECENT_COLUMNS}
          data={recents}
          loading={loading}
          onView={(d) => navigate(`/purchases/order/${d.id_bc}/fiche`)}
          actionsLabel="Action"
          emptyMessage={
            dossiers.length === 0
              ? "Aucun dossier ne vous est encore assigné."
              : "Tous vos dossiers sont livrés."
          }
        />
      </div>

      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Documents manquants
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: 13 }}
            onClick={() => navigate('/purchases/documents-transport')}
          >
            Voir tout
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 dark:bg-gradient-to-b dark:from-[#1a2b4a] dark:to-[#0d1730] dark:border-[#1e293b]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Document</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Référence</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/60 dark:divide-[#334155]/40">
              {DOCUMENTS_MANQUANTS.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">Aucun document manquant</td>
                </tr>
              ) : (
                DOCUMENTS_MANQUANTS.map((m) => (
                  <tr key={`${m.bc}-${m.nom}`} className="align-middle transition-colors even:bg-gray-50/60 hover:bg-gray-50 dark:even:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 shrink-0 rounded-lg bg-gray-100 dark:bg-[#15224a] flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-brand-navy dark:text-white/80"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                        </span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{m.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{m.bc} · {m.fournisseur}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/30 shadow-sm dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25">
                        Manquant
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
