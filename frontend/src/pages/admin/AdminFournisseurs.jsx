import { useState, useEffect } from 'react'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'

const mockFournisseurs = [
  { id_fournisseur: 1, nom_fournisseur: 'ALFATRON', adresse_fournisseur: 'Zone industrielle Alger', tel_fournisseur: 21321234567 },
  { id_fournisseur: 2, nom_fournisseur: 'Bureau Plus', adresse_fournisseur: 'Rue des Frères Boudiaf, Alger', tel_fournisseur: 21321567890 },
  { id_fournisseur: 3, nom_fournisseur: 'Clima Tech', adresse_fournisseur: 'Bab Ezzouar, Alger', tel_fournisseur: 21321333444 },
  { id_fournisseur: 4, nom_fournisseur: 'Paper & Co', adresse_fournisseur: 'Hussein Dey, Alger', tel_fournisseur: 21321888999 },
]

export default function AdminFournisseurs() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get('/fournisseurs/')
      .then((res) => {
        if (active) setData(res.data.length ? res.data : mockFournisseurs)
      })
      .catch(() => {
        if (active) {
          setError('API indisponible — affichage des données de démonstration.')
          setData(mockFournisseurs)
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
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  )
}
