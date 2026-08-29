import { useState, useEffect } from 'react'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'

const mockBons = [
  { id_bc: 1, reference: 'BC-1', fournisseur_nom: 'ALFATRON', date_creation: '2026-08-10', montant: 425000, status: 'en cours' },
  { id_bc: 2, reference: 'BC-2', fournisseur_nom: 'Paper & Co', date_creation: '2026-08-11', montant: 31000, status: 'en cours' },
]

export default function AdminBonsCommande() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get('/bons-commande/')
      .then((res) => {
        if (active) setData(res.data.length ? res.data : mockBons)
      })
      .catch(() => {
        if (active) {
          setError('API indisponible — affichage des données de démonstration.')
          setData(mockBons)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const columns = [
    { key: 'id_bc', header: 'N° Bon', sortable: true },
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
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  )
}
