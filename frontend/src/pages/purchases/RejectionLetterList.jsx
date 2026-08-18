import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'
import { formatDate } from '../../utils/format'

export default function RejectionLetterList() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api.get('/demandes/?statut=refusee')
      .then((res) => {
        if (active) setData(res.data)
      })
      .catch(() => {
        if (active) setError('Erreur lors du chargement des lettres de rejet.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const columns = [
    { key: 'numero_da', header: 'N° DA', sortable: true },
    { key: 'demandeur_nom', header: 'Demandeur', sortable: true },
    { key: 'date_rejet', header: 'Date de rejet', sortable: true, render: (r) => formatDate(r.date_rejet) },
    { key: 'motif_refus', header: 'Motif' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lettres de rejet</h1>
          <p className="text-sm text-gray-500 mt-1">Demandes d'achat refusées</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          ← Retour
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onView={(request) => navigate(`/purchases/request/${request.id_da}/fiche`)}
      />
    </div>
  )
}