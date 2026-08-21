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
  en_cours: {
    label: 'En cours',
    color: 'bg-blue-100 text-blue-800 dark:bg-[#1e40af] dark:text-[#bfdbfe]',
  },

  approuvee: {
    label: 'Approuvée',
    color: 'bg-green-100 text-green-800 dark:bg-[#166534] dark:text-[#86efac]',
  },

  refusee: {
    label: 'Refusée',
    color: 'bg-red-100 text-red-800 dark:bg-[#991b1b] dark:text-[#fca5a5]',
  },

  'en cours': { label: 'En cours', color: 'bg-blue-100 text-blue-800 dark:bg-[#1e40af] dark:text-[#bfdbfe]' },
  'annulé': { label: 'Annulé', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 dark:bg-[#854d0e] dark:text-[#fde047]' },
  approved: { label: 'Approuvé', color: 'bg-green-100 text-green-800 dark:bg-[#166534] dark:text-[#86efac]' },
  rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-800 dark:bg-[#991b1b] dark:text-[#fca5a5]' },
  delivered: { label: 'Livré', color: 'bg-blue-100 text-blue-800 dark:bg-[#1e40af] dark:text-[#bfdbfe]' },
  cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  partial: { label: 'Partiel', color: 'bg-orange-100 text-orange-800 dark:bg-[#c2410c] dark:text-[#fdba74]' },
  completed: { label: 'Complété', color: 'bg-green-100 text-green-800 dark:bg-[#166534] dark:text-[#86efac]' },
  paid: { label: 'Payé', color: 'bg-green-100 text-green-800 dark:bg-[#166534] dark:text-[#86efac]' },
  overdue: { label: 'En retard', color: 'bg-red-100 text-red-800 dark:bg-[#991b1b] dark:text-[#fca5a5]' },
  actif: { label: 'Actif', color: 'bg-green-100 text-green-800 dark:bg-[#166534] dark:text-[#86efac]' },
  archivé: { label: 'Archivé', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
}

