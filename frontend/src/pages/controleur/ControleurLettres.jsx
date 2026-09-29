import { useState, useEffect } from 'react'
import { useLayout } from '../../context/LayoutContext'
import { useControleur } from './ControleurContext'

export default function ControleurLettres() {
  const { setSubtitle } = useLayout()
  const { lettres } = useControleur()
  const [search, setSearch] = useState('')

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
                  <tr key={l.numero} className="align-middle transition-colors even:bg-gray-50/60 hover:bg-gray-50 dark:even:bg-white/[0.02] dark:hover:bg-white/[0.04]">
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
    </div>
  )
}
