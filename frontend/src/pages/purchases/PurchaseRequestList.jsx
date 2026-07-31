import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'

const mockData = []

export default function PurchaseRequestList() {
  const navigate = useNavigate()
  const [data] = useState(mockData)

  const columns = [
    { key: 'request_number', header: 'N° Demande', sortable: true },
    { key: 'requester', header: 'Demandeur', sortable: true },
    { key: 'department', header: 'Département' },
    { key: 'date', header: 'Date', sortable: true },
    { key: 'status', header: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => navigate('/purchases/request/new')} className="btn-primary">+ Nouvelle demande</button>
      </div>
      <DataTable columns={columns} data={data} onEdit={(r) => navigate(`/purchases/request/${r.id}`)} />
    </div>
  )
}
