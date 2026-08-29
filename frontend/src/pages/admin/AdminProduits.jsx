import { useState, useEffect } from 'react'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'

const mockProduits = [
  { num_produit: 1, nom_produit: 'PC ALFATRON', prix_unit: 85000, fournisseur_nom: 'ALFATRON' },
  { num_produit: 2, nom_produit: 'Clavier', prix_unit: 2500, fournisseur_nom: 'ALFATRON' },
  { num_produit: 3, nom_produit: 'Souris', prix_unit: 1500, fournisseur_nom: 'ALFATRON' },
  { num_produit: 4, nom_produit: 'Climatiseur', prix_unit: 75000, fournisseur_nom: 'Clima Tech' },
  { num_produit: 5, nom_produit: 'Cahier', prix_unit: 350, fournisseur_nom: 'Paper & Co' },
]

export default function AdminProduits() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get('/produits/')
      .then((res) => {
        if (active) setData(res.data.length ? res.data : mockProduits)
      })
      .catch(() => {
        if (active) {
          setError('API indisponible — affichage des données de démonstration.')
          setData(mockProduits)
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
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  )
}
