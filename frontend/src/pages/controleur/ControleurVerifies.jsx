import { useState, useEffect } from 'react'
import { useLayout } from '../../context/LayoutContext'
import { useControleur } from './ControleurContext'

export default function ControleurVerifies() {
  const { setSubtitle } = useLayout()
  const { dossiers } = useControleur()
  const [search, setSearch] = useState('')

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
                  <tr key={d.bc} className="align-middle transition-colors even:bg-gray-50/60 hover:bg-gray-50 dark:even:bg-white/[0.02] dark:hover:bg-white/[0.04]">
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
    </div>
  )
}
