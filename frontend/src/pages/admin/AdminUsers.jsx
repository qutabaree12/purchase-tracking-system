import { useState, useEffect } from 'react'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'

const mockUsers = [
  { id_emp: 1, full_name: 'Ahmed Benali', email: 'ahmed.benali@algerietelecom.dz', role: 'admin', etat: 'actif' },
  { id_emp: 2, full_name: 'Fatima Ouali', email: 'fatima.ouali@algerietelecom.dz', role: 'admin', etat: 'actif' },
  { id_emp: 3, full_name: 'Sofiane Kadi', email: 'sofiane.kadi@algerietelecom.dz', role: 'demandeur', etat: 'actif' },
  { id_emp: 4, full_name: 'Rachid Toumi', email: 'rachid.toumi@algerietelecom.dz', role: 'chef département', etat: 'actif' },
  { id_emp: 5, full_name: 'Ali Mokhtari', email: 'ali.mokhtari@algerietelecom.dz', role: 'acheteur', etat: 'actif' },
]

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get('/users/')
      .then((res) => {
        if (active) setUsers(res.data.length ? res.data : mockUsers)
      })
      .catch(() => {
        if (active) {
          setError('API indisponible — affichage des données de démonstration.')
          setUsers(mockUsers)
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
      <DataTable columns={columns} data={users} loading={loading} />
    </div>
  )
}
