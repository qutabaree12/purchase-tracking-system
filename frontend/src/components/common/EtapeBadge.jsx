import { ETAPES } from '../../utils/suivi'

export default function EtapeBadge({ etape }) {
  const config = ETAPES[etape] || ETAPES.attente_bc
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.tone}`}>
      {config.label}
    </span>
  )
}
