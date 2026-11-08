import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useLayout } from '../../context/LayoutContext'
import { formatDate } from '../../utils/format'

const liste = (res) => (Array.isArray(res.data) ? res.data : res.data.results || [])

function formatMontant(montant) {
  if (montant == null) return '—'
  return `${Number(montant).toLocaleString('fr-FR')} DZD`
}

export default function LettresCreditAcheteur() {
  const navigate = useNavigate()
  const { setSubtitle } = useLayout()
  const [dossiers, setDossiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setSubtitle('Lettres de crédit reçues du contrôleur')
  }, [setSubtitle])

  useEffect(() => {
    let active = true
    api
      .get('/dossiers-importation/')
      .then((res) => {
        if (active) setDossiers(liste(res))
      })
      .catch(() => {
        if (active) setError('Impossible de charger les lettres de crédit.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const lettres = useMemo(
    () => dossiers.filter((d) => d.statut_controle === 'valide' && d.numero_lc),
    [dossiers]
  )

  const q = search.trim().toLowerCase()
  const filtered = lettres.filter(
    (d) => !q || `${d.numero_lc} ${d.bc_reference} ${d.fournisseur_nom}`.toLowerCase().includes(q)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="input"
            style={{ paddingLeft: 34 }}
            placeholder="Rechercher une lettre, un BC, un fournisseur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-sm text-gray-500">
          {lettres.length} lettre{lettres.length > 1 ? 's' : ''} reçue{lettres.length > 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <div className="card overflow-hidden">
        <div className="card-header">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Lettres de crédit validées par le contrôleur
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 dark:bg-gradient-to-b dark:from-[#1a2b4a] dark:to-[#0d1730] dark:border-[#1e293b]">
                {['N° lettre', 'BC', 'Fournisseur', 'Montant', 'Banque', 'Date de la lettre', 'Reçue le', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/60 dark:divide-[#334155]/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Aucune lettre de crédit reçue pour le moment.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr
                    key={d.id_dossier}
                    onClick={() => setSelected(d)}
                    className="align-middle cursor-pointer transition-colors even:bg-gray-50/60 hover:bg-gray-50 dark:even:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{d.numero_lc}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{d.bc_reference}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{d.fournisseur_nom || '—'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 tabular-nums">{formatMontant(d.montant)}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{d.banque_lc || '—'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 tabular-nums">
                      {d.date_lc ? formatDate(d.date_lc) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25">
                        {d.date_controle ? formatDate(d.date_controle) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => navigate(`/purchases/order/${d.id_bc}/fiche`)}
                        className="text-blue-600 hover:text-blue-500 dark:text-[#93bbfd] dark:hover:text-[#bfdbfe] text-sm font-medium transition-colors"
                      >
                        Voir le BC
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative bg-white dark:bg-[#101a38] rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1e293b] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-navy dark:text-white">
                Lettre de crédit — {selected.numero_lc}
              </h2>
              <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              {[
                ['Bon de commande', selected.bc_reference],
                ['Fournisseur', selected.fournisseur_nom || '—'],
                ['Montant', formatMontant(selected.montant)],
                ['Banque émettrice', selected.banque_lc || '—'],
                ['Date de la lettre', selected.date_lc ? formatDate(selected.date_lc) : '—'],
                ['Contrôlée le', selected.date_controle ? formatDate(selected.date_controle) : '—'],
                ['Observation du contrôleur', selected.commentaire_controle || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-gray-100 dark:border-[#1e293b] pb-2">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 text-right">{value}</span>
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setSelected(null)}>Fermer</button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate(`/purchases/order/${selected.id_bc}/fiche`)}
                >
                  Voir le bon de commande
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
