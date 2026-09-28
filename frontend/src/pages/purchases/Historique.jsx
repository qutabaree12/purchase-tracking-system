import { useState, useEffect } from 'react'
import { useLayout } from '../../context/LayoutContext'

const HISTORIQUE = [
  { id: 'BC-2026-0139', fournisseur: 'Siemens AG', tarif: '120 000 DZD', livreLe: '18/09/2026' },
  { id: 'BC-2026-0137', fournisseur: 'Nokia', tarif: '54 500 DZD', livreLe: '11/09/2026' },
  { id: 'BC-2026-0135', fournisseur: 'Câblerie El-Djazaïr', tarif: '9 300 DZD', livreLe: '02/09/2026' },
  { id: 'BC-2026-0131', fournisseur: 'Ericsson', tarif: '88 000 DZD', livreLe: '27/08/2026' },
]

export default function Historique() {
  const { setSubtitle } = useLayout()
  const [search, setSearch] = useState('')

  useEffect(() => {
    setSubtitle('Dossiers clôturés et livrés')
  }, [setSubtitle])

  const q = search.trim().toLowerCase()
  const filtered = HISTORIQUE.filter(
    (h) => !q || `${h.id} ${h.fournisseur}`.toLowerCase().includes(q)
  )

  return (
    <div className="space-y-6">
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
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 dark:bg-gradient-to-b dark:from-[#1a2b4a] dark:to-[#0d1730] dark:border-[#1e293b]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">N° BC</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Fournisseur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Tarif douane</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Livré le</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/60 dark:divide-[#334155]/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Aucun dossier trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((h) => (
                  <tr key={h.id} className="align-middle transition-colors even:bg-gray-50/60 hover:bg-gray-50 dark:even:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                    <td className="px-4 py-3 font-semibold text-gray-800">{h.id}</td>
                    <td className="px-4 py-3 text-gray-700">{h.fournisseur}</td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">{h.tarif}</td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">{h.livreLe}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25">
                        Livré
                      </span>
                    </td>
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
