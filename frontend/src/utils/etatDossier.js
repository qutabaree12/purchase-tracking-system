// Avancement d'un dossier d'importation, déduit des champs renvoyés par l'API.
const TONES = {
  gris: 'bg-gray-500/10 text-gray-700 ring-1 ring-gray-400/30 dark:bg-white/10 dark:text-gray-300 dark:ring-white/15',
  orange: 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25',
  bleu: 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/25',
  rouge: 'bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25',
  vert: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25',
}

export const ETATS_DOSSIER = {
  sans_transitaire: { label: 'Sans transitaire', color: TONES.rouge },
  non_commence: { label: 'Non commencé', color: TONES.gris },
  remplissage: { label: 'En cours de remplissage', color: TONES.orange },
  soumis: { label: 'Soumis au contrôleur', color: TONES.bleu },
  refuse: { label: 'Refusé — à corriger', color: TONES.rouge },
  valide: { label: 'Validé — réception possible', color: TONES.vert },
  livre: { label: 'Livré', color: TONES.vert },
}

// États que le transitaire peut filtrer dans sa liste.
export const ETATS_FILTRABLES = ['non_commence', 'remplissage', 'soumis', 'refuse', 'valide']

export function etatDossier(d) {
  if (!d) return 'non_commence'
  if (d.id_transitaire === null) return 'sans_transitaire'
  if (d.statut === 'livré') return 'livre'
  if (d.statut_controle === 'valide') return 'valide'
  if (d.statut_controle === 'refuse') return 'refuse'
  if (d.pret_pour_controle) return 'soumis'
  const commence = Boolean(
    d.mode_expedition || d.lieu_chargement || d.date_livraison_prevue ||
    d.tarif_douane || d.numero_autorisation
  )
  return commence ? 'remplissage' : 'non_commence'
}
