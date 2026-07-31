import { useState } from 'react'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'

const mockUsers = []

export default function AdminUsers() {
  const [users] = useState(mockUsers)

  const columns = [
    { key: 'full_name', header: 'Nom', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Rôle', sortable: true },
    { key: 'etat', header: 'État', render: (u) => <StatusBadge status={u.etat === 'actif' ? 'completed' : 'cancelled'} /> },
  ]

  return (
    <div className="space-y-6">
      <DataTable columns={columns} data={users} />
    </div>
  )
}
