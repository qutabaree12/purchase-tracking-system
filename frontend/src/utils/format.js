export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
  }).format(amount)
}

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export const statusLabels = {
  'en cours': { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  'annulé': { label: 'Annulé', color: 'bg-gray-100 text-gray-800' },
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approuvé', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-800' },
  delivered: { label: 'Livré', color: 'bg-blue-100 text-blue-800' },
  cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-800' },
  partial: { label: 'Partiel', color: 'bg-orange-100 text-orange-800' },
  completed: { label: 'Complété', color: 'bg-green-100 text-green-800' },
  paid: { label: 'Payé', color: 'bg-green-100 text-green-800' },
  overdue: { label: 'En retard', color: 'bg-red-100 text-red-800' },
  actif: { label: 'Actif', color: 'bg-green-100 text-green-800' },
  archivé: { label: 'Archivé', color: 'bg-gray-100 text-gray-800' },
}
