import { useState, useEffect, useMemo } from 'react'
import { useLayout } from '../../context/LayoutContext'

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ShipIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-8.5-3.5L4 14a11.6 11.6 0 0 0 1.62 6" />
    <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" />
    <path d="M12 10v4" />
    <path d="M12 2v3" />
  </svg>
)

const PlaneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </svg>
)

const TruckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <circle cx="17" cy="18" r="2" />
    <circle cx="7" cy="18" r="2" />
  </svg>
)

const MODE_ICONS = {
  Maritime: ShipIcon,
  Aérien: PlaneIcon,
  Terrestre: TruckIcon,
}

const STATUT_BADGES = {
  'En cours': 'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/30 shadow-sm dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25',
  'À traiter': 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 shadow-sm dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25',
  Livré: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25',
}

const EXPEDITIONS = [
  {
    id: 'BC-2026-0142',
    fournisseur: 'ALFATRON',
    mode: 'Maritime',
    statut: 'En cours',
    progress: 50,
    progressLabel: '2/5 étapes',
    steps: [
      { title: 'Départ du port de Marseille', desc: '20/09/2026 — confirmé par le transporteur', status: 'done' },
      { title: 'Transbordement — Valence', desc: '24/09/2026 — navire MSC ORCHESTRA', status: 'done' },
      { title: "Arrivée au port d'Alger", desc: '28/09/2026 (prévu) — en cours de navigation', status: 'now' },
      { title: 'Dédouanement', desc: 'En attente — tarif douane saisi : 42 000 DZD', status: 'future' },
      { title: 'Livraison', desc: '05/10/2026 (prévu)', status: 'future' },
    ],
  },
  {
    id: 'BC-2026-0143',
    fournisseur: 'Paper & Co',
    mode: 'Aérien',
    statut: 'En cours',
    progress: 30,
    progressLabel: '1/5 étape',
    steps: [
      { title: 'Enlèvement chez le fournisseur', desc: '25/09/2026 — confirmé', status: 'done' },
      { title: 'Embarquement à CDG Paris', desc: '27/09/2026 (prévu) — en préparation', status: 'now' },
      { title: 'En vol', desc: 'À venir', status: 'future' },
      { title: "Arrivée à l'aéroport d'Alger", desc: 'À venir', status: 'future' },
      { title: 'Livraison', desc: '08/10/2026 (prévu)', status: 'future' },
    ],
  },
  {
    id: 'BC-2026-0144',
    fournisseur: 'Câblerie El-Djazaïr',
    mode: 'Terrestre',
    statut: 'À traiter',
    progress: 0,
    progressLabel: '0/5 étape',
    steps: [
      { title: 'Chargement à Oran', desc: 'À venir', status: 'future' },
      { title: 'Transport routier', desc: 'À venir', status: 'future' },
      { title: 'Arrivée à Alger', desc: 'À venir', status: 'future' },
      { title: 'Dédouanement', desc: 'À venir', status: 'future' },
      { title: 'Livraison', desc: '11/10/2026 (prévu)', status: 'future' },
    ],
  },
  {
    id: 'BC-2026-0140',
    fournisseur: 'Huawei',
    mode: 'Aérien',
    statut: 'Livré',
    progress: 100,
    progressLabel: '5/5 étapes',
    steps: [
      { title: 'Enlèvement chez le fournisseur', desc: '18/09/2026 — confirmé', status: 'done' },
      { title: 'Embarquement', desc: '19/09/2026 — Emirates SkyCargo', status: 'done' },
      { title: 'En vol', desc: '20/09/2026', status: 'done' },
      { title: 'Arrivée à Alger', desc: '21/09/2026', status: 'done' },
      { title: 'Livré', desc: '02/10/2026 — réception validée', status: 'done' },
    ],
  },
]

function Badge({ tone, children }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tone}`}>
      {children}
    </span>
  )
}

export default function SuiviTransport() {
  const { setSubtitle } = useLayout()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(EXPEDITIONS[0].id)

  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!q) return EXPEDITIONS
    return EXPEDITIONS.filter((e) =>
      `${e.id} · ${e.fournisseur} · ${e.mode}`.toLowerCase().includes(q)
    )
  }, [q])

  const selected = filtered.find((e) => e.id === selectedId) || filtered[0]

  useEffect(() => {
    if (selected) setSubtitle(`${selected.id} · ${selected.fournisseur} · ${selected.mode}`)
  }, [selected, setSubtitle])

  if (!selected) {
    return (
      <div className="card">
        <div className="card-body text-center py-8 text-gray-500">Aucun dossier trouvé</div>
      </div>
    )
  }

  const ModeIcon = MODE_ICONS[selected.mode]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="input"
            style={{ paddingLeft: 34 }}
            placeholder="Rechercher BC · fournisseur · mode…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">
        <div className="space-y-2">
          {filtered.map((e) => {
            const active = e.id === selected.id
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => setSelectedId(e.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  active
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white border-brand-line text-gray-700 hover:bg-gray-50 dark:bg-[#101a38] dark:text-gray-200 dark:border-[#1e293b] dark:hover:bg-[#15224a]'
                }`}
              >
                <span className="block text-sm font-semibold truncate">
                  {e.id} · {e.fournisseur}
                </span>
                <span className={`block text-xs mt-0.5 ${active ? 'text-white/70' : 'text-gray-500'}`}>
                  {e.mode}
                </span>
              </button>
            )
          })}
        </div>

        <div className="card overflow-hidden">
          <div className="card-body">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[15px] font-bold text-brand-navy dark:text-white">
                  {selected.id} · {selected.fournisseur}
                </span>
                <Badge tone="bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/30 shadow-sm dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25">{selected.mode}</Badge>
                <Badge tone={STATUT_BADGES[selected.statut]}>{selected.statut}</Badge>
                <Badge tone="bg-gray-500/10 text-gray-700 ring-1 ring-gray-400/30 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:ring-white/15">Transitaire</Badge>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                  {selected.progressLabel} · {selected.progress}%
                </span>
                <div className="w-[150px] h-2 rounded-full bg-gray-100 dark:bg-[#15224a] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#007a33] dark:bg-[#00a651]"
                    style={{ width: `${selected.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="suivi-timeline" style={{ '--progress': `${selected.progress}%` }}>
              {selected.steps.map((step) => (
                <div
                  key={step.title}
                  className={`suivi-step ${step.status === 'future' ? 'future' : ''} ${
                    step.status === 'now' ? 'now' : ''
                  }`}
                >
                  <span className={`suivi-node ${step.status}`}>
                    {step.status === 'done' && <CheckIcon />}
                    {step.status === 'now' && ModeIcon && <ModeIcon />}
                  </span>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{step.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
