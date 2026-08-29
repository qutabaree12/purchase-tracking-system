import { useState, useEffect } from 'react'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { formatDate } from '../../utils/format'

const mockDemandes = [
  { id_da: 1, numero_da: 'DA-ALG-2026-001', dot: 'Alger-Centre', demandeur_nom: 'Sara Meziane', acheteur_nom: 'Omar Benaissa', date_creation: '2026-07-20', objet: 'Renouvellement matériel réseau', statut: 'en_cours' },
  { id_da: 2, numero_da: 'DA-ALG-2026-002', dot: 'Oran', demandeur_nom: 'Yacine Haddad', acheteur_nom: 'Omar Benaissa', date_creation: '2026-07-22', objet: 'Connecteurs réseau', statut: 'approuvee' },
  { id_da: 3, numero_da: 'DA-ALG-2026-003', dot: 'Sétif', demandeur_nom: 'Amina Cherif', acheteur_nom: null, date_creation: '2026-07-25', objet: 'Câbles cuivre 50m', statut: 'en_cours' },
]

export default function AdminDemandes() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get('/demandes/')
      .then((res) => {
        if (active) setData(res.data.length ? res.data : mockDemandes)
      })
      .catch(() => {
        if (active) {
          setError('API indisponible — affichage des données de démonstration.')
          setData(mockDemandes)
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
    { key: 'numero_da', header: 'N° DA', sortable: true },
    { key: 'dot', header: 'DOT' },
    { key: 'demandeur_nom', header: 'Demandeur', sortable: true },
    { key: 'acheteur_nom', header: 'Acheteur' },
    { key: 'date_creation', header: 'Date', sortable: true, render: (r) => formatDate(r.date_creation) },
    { key: 'objet', header: 'Objet' },
    { key: 'statut', header: 'Statut', render: (r) => <StatusBadge status={r.statut} /> },
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
