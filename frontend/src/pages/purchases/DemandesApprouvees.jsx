import { useState, useEffect } from 'react'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { formatDate } from '../../utils/format'

export default function DemandesApprouvees() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDemandes = async () => {
      try {
        const res = await api.get('/demandes/?statut=approuvee')
        setData(res.data)
      } catch {
        setError('Erreur lors du chargement des demandes approuvées.')
      } finally {
        setLoading(false)
      }
    }
    fetchDemandes()
  }, [])

  const columns = [
    { key: 'numero_da', header: 'N° DA', sortable: true },
    { key: 'dot', header: 'DOT' },
    { key: 'demandeur_nom', header: 'Demandeur', sortable: true },
    { key: 'date_creation', header: 'Date', sortable: true, render: (r) => formatDate(r.date_creation) },
    { key: 'objet', header: 'Objet' },
    { key: 'statut', header: 'Statut', render: () => <StatusBadge status="approved" /> },
  ]

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  )
}
