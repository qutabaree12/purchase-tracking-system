import { useState, useEffect } from 'react'
import { useLayout } from '../../context/LayoutContext'
import { useControleur } from './ControleurContext'

export default function ControleurVerifies() {
  const { setSubtitle } = useLayout()
  const { dossiers } = useControleur()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setSubtitle('Dossiers contrôlés et clôturés')
  }, [setSubtitle])

  const q = search.trim().toLowerCase()
  const verifies = dossiers.filter(
    (d) => d.statut === 'verifie' && (!q || `${d.bc} ${d.fournisseur}`.toLowerCase().includes(q))
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
            placeholder="Rechercher un BC, fournisseur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Dossiers vérifiés</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 dark:bg-gradient-to-b dark:from-[#1a2b4a] dark:to-[#0d1730] dark:border-[#1e293b]">
                {['N° BC', 'Fournisseur', 'DA liée', 'Montant', 'Tarif douane', 'Vérifié le'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/60 dark:divide-[#334155]/40">
              {verifies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucun dossier vérifié</td>
                </tr>
              ) : (
                verifies.map((d) => (
                    <tr
                      key={d.bc}
                      onClick={() => setSelected(d)}
                      className="align-middle cursor-pointer transition-colors even:bg-gray-50/60 hover:bg-gray-50 dark:even:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                    >
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{d.bc}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{d.fournisseur}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 tabular-nums">{d.da}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 tabular-nums">{d.montant}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 tabular-nums">{d.tarif}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25">
                        {d.dateVerif || '—'}
                      </span>
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
          <div className="relative bg-white dark:bg-[#101a38] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1e293b] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-navy dark:text-white">
                Dossier vérifié — {selected.bc}
              </h2>
              <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-[#15224a] rounded-lg px-4 py-3 mb-4">
                <div>
                  <p className="text-[11px] text-gray-500">N° Bon de commande</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selected.bc}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Demande d'achat</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selected.da}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Fournisseur</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selected.fournisseur}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Montant</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selected.montant}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                <div>
                  <p className="text-[11px] text-gray-500">Tarif douane</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{selected.tarif}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Vérifié le</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{selected.dateVerif || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Statut</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25">
                    Vérifié
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" className="btn-secondary" onClick={() => setSelected(null)}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
