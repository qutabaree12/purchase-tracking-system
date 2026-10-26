export const TONES = {
  gris: 'bg-gray-500/10 text-gray-700 ring-1 ring-gray-400/30 dark:bg-white/10 dark:text-gray-300 dark:ring-white/15',
  bleu: 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/25',
  orange: 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25',
  vert: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25',
  rouge: 'bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25',
}

export const ETAPES = {
  attente_bc: { label: 'En attente de bon de commande', tone: TONES.gris },
  a_traiter: { label: 'En attente du transitaire', tone: TONES.orange },
  en_cours: { label: 'Importation en cours', tone: TONES.bleu },
  livre: { label: 'Livré', tone: TONES.vert },
  annule: { label: 'Bon de commande annulé', tone: TONES.rouge },
}

// Déduit l'étape d'une commande à partir de l'objet "suivi" renvoyé par l'API
export function etapeSuivi(bc) {
  if (!bc) return 'attente_bc'
  if (bc.statut_bc === 'annulé') return 'annule'
  if (bc.statut_dossier === 'livré') return 'livre'
  if (bc.statut_dossier === 'en cours') return 'en_cours'
  return 'a_traiter'
}