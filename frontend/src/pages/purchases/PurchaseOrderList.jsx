import { useState, useEffect } from 'react'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR')
}

function exporterCSV(bons) {
  const lignes = [
    ['N° Bon', 'Fournisseur', 'Date', 'Montant (DZD)', 'Statut'],
  ]
  for (const b of bons) {
    lignes.push([b.id_bc, b.fournisseur_nom, formatDate(b.date_creation), b.montant, b.status])
  }
  const csv = lignes.map((l) => l.map((c) => `"${String(c ?? '')}"`).join(';')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'bons-de-commande.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function PurchaseOrderList() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBons = async () => {
      try {
        const res = await api.get('/bons-commande/')
        setData(res.data)
      } catch {
        setError('Erreur lors du chargement des bons de commande.')
      } finally {
        setLoading(false)
      }
    }
    fetchBons()
  }, [])

  const columns = [
    { key: 'id_bc', header: 'N° Bon', sortable: true },
    { key: 'fournisseur_nom', header: 'Fournisseur', sortable: true },
    { key: 'date_creation', header: 'Date', sortable: true, render: (o) => formatDate(o.date_creation) },
    { key: 'montant', header: 'Montant', render: (o) => `${Number(o.montant || 0).toLocaleString('fr-FR')} DZD` },
    { key: 'status', header: 'Statut', render: (o) => <StatusBadge status={o.status} /> },
  ]

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      <div className="flex justify-end">
        <button
          onClick={() => exporterCSV(data)}
          disabled={data.length === 0}
          className="btn-secondary"
          title="Exporter les bons de commande en CSV (imprimable en PDF)"
        >
          Exporter CSV
        </button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  )
}
