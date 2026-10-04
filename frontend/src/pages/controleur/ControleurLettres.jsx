import { useState, useEffect } from 'react'
import { useLayout } from '../../context/LayoutContext'
import { useControleur } from './ControleurContext'

export default function ControleurLettres() {
  const { setSubtitle } = useLayout()
  const { lettres } = useControleur()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setSubtitle('Lettres générées et transmises à l\'acheteur')
  }, [setSubtitle])

  const q = search.trim().toLowerCase()
  const filtered = lettres.filter(
    (l) => !q || `${l.numero} ${l.bc} ${l.fournisseur}`.toLowerCase().includes(q)
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
            placeholder="Rechercher une lettre, BC…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Lettres de crédit générées</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 dark:bg-gradient-to-b dark:from-[#1a2b4a] dark:to-[#0d1730] dark:border-[#1e293b]">
                {['N° lettre', 'BC', 'Fournisseur', 'Montant', 'Banque', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/60 dark:divide-[#334155]/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucune lettre générée</td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr
                    key={l.numero}
                    onClick={() => setSelected(l)}
                    className="align-middle cursor-pointer transition-colors even:bg-gray-50/60 hover:bg-gray-50 dark:even:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{l.numero}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{l.bc}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{l.fournisseur}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 tabular-nums">{l.montant}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{l.banque}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 tabular-nums">{l.date}</td>
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
          <div className="relative bg-white dark:bg-[#101a38] rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1e293b] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-navy dark:text-white">
                {selected.numero}
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Bon de commande</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{selected.bc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fournisseur</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{selected.fournisseur}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Montant</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{selected.montant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Banque</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{selected.banque}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{selected.date}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}