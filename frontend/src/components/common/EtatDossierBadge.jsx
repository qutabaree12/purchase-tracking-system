import { ETATS_DOSSIER } from '../../utils/etatDossier'

export default function EtatDossierBadge({ etat }) {
  const config = ETATS_DOSSIER[etat] || ETATS_DOSSIER.non_commence
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config.color}`}>
      {config.label}
    </span>
  )
}
