import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtre, setFiltre] = useState('toutes')

  // Demande à la cloche de la TopBar de se rafraîchir
  const refreshBell = () => window.dispatchEvent(new Event('notifications:refresh'))

  useEffect(() => {
    let active = true
    api
      .get('/notifications/')
      .then((res) => {
        if (active) setNotifications(res.data || [])
      })
      .catch(() => {
        if (active) setError('Erreur lors du chargement des notifications.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const nonLues = notifications.filter((n) => !n.lu).length
  const visibles = filtre === 'non_lues' ? notifications.filter((n) => !n.lu) : notifications

  const handleOpen = async (notification) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id_notification === notification.id_notification ? { ...n, lu: true } : n
      )
    )
    try {
      await api.post(`/notifications/${notification.id_notification}/marquer_lue/`)
      refreshBell()
    } catch (err) {
      console.error(err)
    }
    if (notification.demande) {
      navigate(`/purchases/request/${notification.demande}/fiche`)
    } else if (notification.bon_commande) {
      navigate(`/purchases/order/${notification.bon_commande}/fiche`)
    }
  }

  const handleMarkAll = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })))
    try {
      await api.post('/notifications/marquer_toutes_lues/')
      refreshBell()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFiltre('toutes')}
            className={filtre === 'toutes' ? 'btn-primary' : 'btn-secondary'}
          >
            Toutes ({notifications.length})
          </button>
          <button
            onClick={() => setFiltre('non_lues')}
            className={filtre === 'non_lues' ? 'btn-primary' : 'btn-secondary'}
          >
            Non lues ({nonLues})
          </button>
        </div>
        {nonLues > 0 && (
          <button onClick={handleMarkAll} className="btn-secondary">
            Tout marquer comme lu
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Chargement...</div>
        ) : visibles.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">Aucune notification.</div>
        ) : (
          visibles.map((n) => (
            <div
              key={n.id_notification}
              onClick={() => handleOpen(n)}
              className={`px-5 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                !n.lu ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {!n.lu && <span className="w-2 h-2 mt-2 rounded-full bg-blue-600 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{n.titre}</p>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.date_creation).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
