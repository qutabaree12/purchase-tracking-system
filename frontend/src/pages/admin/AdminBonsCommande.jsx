import { useState, useEffect } from 'react'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'

export default function AdminBonsCommande() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get('/bons-commande/')
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : res.data.results || []
        if (active) setData(items)
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.detail || 'Erreur lors du chargement des bons de commande.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const columns = [
    { key: 'reference', header: 'N° BC', sortable: true },
    { key: 'fournisseur_nom', header: 'Fournisseur', sortable: true },
    { key: 'date_creation', header: 'Date', sortable: true, render: (b) => (b.date_creation ? new Date(b.date_creation).toLocaleDateString('fr-FR') : '-') },
    { key: 'montant', header: 'Montant', render: (b) => `${Number(b.montant || 0).toLocaleString('fr-FR')} DZD` },
    { key: 'status', header: 'Statut', render: (b) => <StatusBadge status={b.status} /> },
  ]

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="Aucun bon de commande enregistré." />
    </div>
  )
}
