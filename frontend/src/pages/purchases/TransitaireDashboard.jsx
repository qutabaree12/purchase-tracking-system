import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import StatusBadge from '../../components/common/StatusBadge'
import { formatDate } from '../../utils/format'

function Kpi({ label, value, color }) {
  return (
    <div className="card px-6 py-5">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  )
}

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
        <Kpi label="À traiter" value={aTraiter} color="text-amber-500" />
        <Kpi label="En cours" value={enCours} color="text-blue-600" />
        <Kpi label="Livrés" value={livres} color="text-green-600" />
        <Kpi label="En retard" value={enRetard} color="text-red-500" />
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

        {loading ? (
          <div className="px-6 py-8 text-center text-gray-500">Chargement...</div>
        ) : recents.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">Aucun dossier récent</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">N° BC</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Fournisseur</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Mode</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Livraison prévue</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recents.map((d) => (
                  <tr key={d.id_dossier} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">{d.bc_reference || `BC-${d.id_bc}`}</td>
                    <td className="px-4 py-3 text-gray-700">{d.fournisseur_nom || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{d.mode_expedition || '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.statut} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {d.date_livraison_prevue ? formatDate(d.date_livraison_prevue) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/purchases/order/${d.id_bc}/fiche`)}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      >
                        Fiche
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
