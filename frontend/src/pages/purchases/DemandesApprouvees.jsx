import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/format'
import { getMockApproved } from '../../constants/mockDemandes'

export default function DemandesApprouvees() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get('/demandes/?statut=approuvee')
      .then((res) => {
        if (active) setData(res.data.length ? res.data : getMockApproved(user))
      })
      .catch(() => {
        if (active) setData(getMockApproved(user))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const handleViewFiche = (request) => {
    navigate(`/purchases/request/${request.id_da}/fiche`)
  }

  const columns = [
    { key: 'numero_da', header: 'N° DA', sortable: true },
    { key: 'dot', header: 'DOT' },
    { key: 'demandeur_nom', header: 'Demandeur', sortable: true },
    { key: 'acheteur_nom', header: 'Acheteur' },
    { key: 'date_creation', header: 'Date', sortable: true, render: (r) => formatDate(r.date_creation) },
    { key: 'objet', header: 'Objet' },
    { key: 'date_approbation', header: "Date d'approbation", sortable: true, render: (r) => (r.date_approbation ? formatDate(r.date_approbation) : '—') },
    { key: 'statut', header: 'Statut', render: () => <StatusBadge status="approved" /> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Demandes approuvées</h1>
          <p className="text-sm text-gray-500 mt-1">
            Demandes validées par l'acheteur, prêtes pour le regroupement
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/purchases/regroupement')}>
          Regrouper
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
        onView={handleViewFiche}
        actionsLabel="Avancement"
      />
    </div>
  )
}
