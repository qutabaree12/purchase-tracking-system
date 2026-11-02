import { useState, useEffect } from 'react'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get('/users/')
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : res.data.results || []
        if (active) setUsers(items)
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.detail || 'Erreur lors du chargement des utilisateurs.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const columns = [
    { key: 'full_name', header: 'Nom', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Rôle', sortable: true },
    { key: 'etat', header: 'État', render: (u) => <StatusBadge status={u.etat === 'actif' ? 'completed' : 'cancelled'} /> },
  ]

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      <DataTable columns={columns} data={users} loading={loading} emptyMessage="Aucun utilisateur enregistré." />
    </div>
  )
}
