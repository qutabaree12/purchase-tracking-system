import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'

const mockData = []

export default function PurchaseOrderList() {
  const navigate = useNavigate()
  const [data] = useState(mockData)

  const columns = [
    { key: 'order_number', header: 'N° Bon', sortable: true },
    { key: 'supplier', header: 'Fournisseur', sortable: true },
    { key: 'date', header: 'Date', sortable: true },
    { key: 'total', header: 'Montant', render: (o) => `${o.total.toLocaleString()} DZD` },
    { key: 'status', header: 'Statut', render: (o) => <StatusBadge status={o.status} /> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => navigate('/purchases/order/new')} className="btn-primary">+ Nouveau bon</button>
      </div>
      <DataTable columns={columns} data={data} onEdit={(o) => navigate(`/purchases/order/${o.id}`)} />
    </div>
  )
}
