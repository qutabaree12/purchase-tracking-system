import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { formatDate } from '../../utils/format'
import { etapeSuivi } from '../../utils/suivi'

const STEPS = ['Bon de commande', 'Transitaire', 'Importation', 'Livrée']

// Nombre d'étapes terminées et étape en cours, selon l'étape déduite de l'API
const PROGRESS = {
  attente_bc: { done: 0, current: 0 },
  a_traiter: { done: 1, current: 1 },
  en_cours: { done: 2, current: 2 },
  livre: { done: 4, current: -1 },
}

const FILTRES = [
  { value: 'toutes', label: 'Toutes', test: () => true },
  { value: 'preparation', label: 'En préparation', test: (e) => e === 'attente_bc' || e === 'a_traiter' },
  { value: 'en_cours', label: 'En cours', test: (e) => e === 'en_cours' },
  { value: 'livre', label: 'Livrées', test: (e) => e === 'livre' },
]

function Track({ etape }) {
  if (etape === 'annule') {
    return <p className="text-sm font-medium text-rose-600">Bon de commande annulé</p>
  }
  const { done, current } = PROGRESS[etape]
  return (
    <div className="flex w-full">
      {STEPS.map((label, i) => {
        const isDone = i < done
        const isCurrent = i === current
        const circle = isDone
          ? 'bg-emerald-500 text-white'
          : isCurrent
            ? 'bg-sky-500 text-white ring-4 ring-sky-500/20'
            : 'bg-gray-200 text-gray-400 dark:bg-white/10 dark:text-gray-500'
        const text = isCurrent
          ? 'font-semibold text-gray-800'
          : isDone
            ? 'text-gray-600'
            : 'text-gray-400'
        return (
          <div key={label} className="relative flex flex-1 flex-col items-center">
            {i < STEPS.length - 1 && (
              <span
                className={`absolute left-1/2 top-3 h-0.5 w-full -translate-y-1/2 ${
                  i < done - 1 ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'
                }`}
              />
            )}
            <span className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${circle}`}>
              {isDone ? (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <span className={`mt-1.5 text-center text-[11px] leading-tight ${text}`}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function SuiviLivraisons() {
  const navigate = useNavigate()
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtre, setFiltre] = useState('toutes')

  useEffect(() => {
    let active = true
    api
      .get('/demandes/?statut=approuvee')
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : res.data.results || []
        if (active) setDemandes(items)
      })
      .catch(() => {
        if (active) setError('Erreur lors du chargement du suivi.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Une ligne par commande ; une DA sans BC donne une seule ligne "en attente"
  const lignes = useMemo(() => {
    const rows = []
    demandes.forEach((d) => {
      if (!d.suivi || d.suivi.length === 0) {
        rows.push({ key: `da-${d.id_da}`, demande: d, bc: null, etape: 'attente_bc' })
      } else {
        d.suivi.forEach((bc) =>
          rows.push({ key: `bc-${bc.id_bc}-${d.id_da}`, demande: d, bc, etape: etapeSuivi(bc) })
        )
      }
    })
    return rows
  }, [demandes])

  const test = FILTRES.find((f) => f.value === filtre).test
  const visibles = lignes.filter((r) => test(r.etape))

  const aujourdhui = new Date()
  aujourdhui.setHours(0, 0, 0, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Où en sont vos demandes approuvées, du bon de commande jusqu'à la livraison.
        </p>
        <div className="inline-flex rounded-2xl bg-gray-100 p-1 dark:bg-white/5">
          {FILTRES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltre(f.value)}
              className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all ${
                filtre === f.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-60">{lignes.filter((r) => f.test(r.etape)).length}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="card rounded-3xl overflow-hidden divide-y divide-gray-100">
        {loading ? (
          <p className="px-6 py-10 text-center text-sm text-gray-500">Chargement...</p>
        ) : visibles.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-500">Aucune demande dans cette catégorie.</p>
        ) : (
          visibles.map((r) => {
            const prevue = r.bc?.date_livraison_prevue
            const recue = r.bc?.date_reception_reelle
            const enRetard =
              r.etape !== 'livre' && r.etape !== 'annule' && prevue && new Date(prevue) < aujourdhui
            const ouvrir = () => navigate(`/purchases/request/${r.demande.id_da}/fiche`)
            return (
              <div
                key={r.key}
                onClick={ouvrir}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    ouvrir()
                  }
                }}
                role="button"
                tabIndex={0}
                className="grid cursor-pointer items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {r.demande.numero_da} · {r.demande.objet}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {r.bc ? r.bc.reference : 'Bon de commande à venir'}
                  </p>
                </div>

                <Track etape={r.etape} />

                <div className="flex items-center gap-3 lg:justify-end">
                  <div className="text-xs lg:text-right">
                    {recue ? (
                      <p className="font-medium text-emerald-600">Reçue le {formatDate(recue)}</p>
                    ) : prevue ? (
                      <>
                        <p className="text-gray-600">Prévue le {formatDate(prevue)}</p>
                        {enRetard && <p className="font-semibold text-rose-600">En retard</p>}
                      </>
                    ) : (
                      <p className="text-gray-400">Date non définie</p>
                    )}
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
