import { useState, useEffect } from 'react'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'

export default function AdminProduits() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get('/produits/')
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : res.data.results || []
        if (active) setData(items)
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.detail || 'Erreur lors du chargement des produits.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const columns = [
    { key: 'num_produit', header: 'N°', sortable: true },
    { key: 'nom_produit', header: 'Produit', sortable: true },
    { key: 'prix_unit', header: 'Prix unitaire', sortable: true, render: (p) => `${Number(p.prix_unit || 0).toLocaleString('fr-FR')} DZD` },
    { key: 'fournisseur_nom', header: 'Fournisseur', sortable: true },
  ]

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="Aucun produit enregistré." />
    </div>
  )
}
