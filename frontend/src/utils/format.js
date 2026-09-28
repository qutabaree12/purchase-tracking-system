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

export const modeExpeditionLabel = (value) => {
  const labels = {
    maritime: 'Maritime',
    aerien: 'Aérien',
    terrestre: 'Terrestre',
    ferroviaire: 'Ferroviaire',
  }
  return labels[value] || value || '-'
}

export const statusLabels = {
  en_cours: {
    label: 'En cours',
    color: 'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/30 shadow-sm dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25',
  },

  approuvee: {
    label: 'Approuvée',
    color: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25',
  },

  refusee: {
    label: 'Refusée',
    color: 'bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/30 shadow-sm dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25',
  },

  'en cours': { label: 'En cours', color: 'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/30 shadow-sm dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25' },
  'a traiter': { label: 'À traiter', color: 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 shadow-sm dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25' },
  a_valider: { label: 'À valider', color: 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 shadow-sm dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25' },
  'livré': { label: 'Livré', color: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25' },
  'annulé': { label: 'Annulé', color: 'bg-gray-500/10 text-gray-700 ring-1 ring-gray-400/30 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:ring-white/15' },
  draft: { label: 'Brouillon', color: 'bg-gray-500/10 text-gray-700 ring-1 ring-gray-400/30 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:ring-white/15' },
  pending: { label: 'En attente', color: 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 shadow-sm dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25' },
  approved: { label: 'Approuvé', color: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25' },
  rejected: { label: 'Rejeté', color: 'bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/30 shadow-sm dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25' },
  delivered: { label: 'Livré', color: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25' },
  cancelled: { label: 'Annulé', color: 'bg-gray-500/10 text-gray-700 ring-1 ring-gray-400/30 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:ring-white/15' },
  partial: { label: 'Partiel', color: 'bg-orange-500/10 text-orange-700 ring-1 ring-orange-500/30 shadow-sm dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/25' },
  completed: { label: 'Complété', color: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25' },
  paid: { label: 'Payé', color: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25' },
  overdue: { label: 'En retard', color: 'bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/30 shadow-sm dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25' },
  actif: { label: 'Actif', color: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25' },
  archivé: { label: 'Archivé', color: 'bg-gray-500/10 text-gray-700 ring-1 ring-gray-400/30 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:ring-white/15' },
}

