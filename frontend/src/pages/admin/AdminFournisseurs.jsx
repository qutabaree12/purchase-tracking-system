import { useState, useEffect } from 'react'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'

export default function AdminFournisseurs() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get('/fournisseurs/')
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : res.data.results || []
        if (active) setData(items)
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.detail || 'Erreur lors du chargement des fournisseurs.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const columns = [
    { key: 'id_fournisseur', header: 'N°', sortable: true },
    { key: 'nom_fournisseur', header: 'Fournisseur', sortable: true },
    { key: 'adresse_fournisseur', header: 'Adresse' },
    { key: 'tel_fournisseur', header: 'Téléphone', render: (f) => (f.tel_fournisseur ? String(f.tel_fournisseur) : '-') },
  ]

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="Aucun fournisseur enregistré." />
    </div>
  )
}
