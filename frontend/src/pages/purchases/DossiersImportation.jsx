import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { formatDate } from '../../utils/format'

const COLUMNS = [
  { key: 'bc_reference', header: 'N° BC', sortable: true },
  { key: 'fournisseur_nom', header: 'Fournisseur', sortable: true },
  { key: 'mode_expedition', header: 'Mode', render: (d) => d.mode_expedition || '-' },
  { key: 'statut', header: 'Statut', render: (d) => <StatusBadge status={d.statut} /> },
  {
    key: 'date_livraison_prevue',
    header: 'Livraison prévue',
    sortable: true,
    render: (d) => (d.date_livraison_prevue ? formatDate(d.date_livraison_prevue) : '-'),
  },
]

export default function DossiersImportation() {
  const navigate = useNavigate()
  const [dossiers, setDossiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

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

  const q = search.trim().toLowerCase()
  const filtered = dossiers.filter((d) => {
    if (filter !== 'all' && d.statut !== filter) return false
    if (q) {
      const ref = (d.bc_reference || `BC-${d.id_bc}`).toLowerCase()
      const four = (d.fournisseur_nom || '').toLowerCase()
      if (!ref.includes(q) && !four.includes(q)) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="input"
            style={{ paddingLeft: 34 }}
            placeholder="Rechercher un BC, fournisseur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input"
          style={{ width: 'auto' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Tous les statuts</option>
          <option value="a traiter">À traiter</option>
          <option value="en cours">En cours</option>
          <option value="livré">Livré</option>
        </select>
      </div>

      <DataTable
        columns={COLUMNS}
        data={filtered}
        loading={loading}
        onView={(d) => navigate(`/purchases/order/${d.id_bc}/fiche`)}
        actionsLabel="Action"
      />
    </div>
  )
}
