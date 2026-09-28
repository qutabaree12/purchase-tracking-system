import { useState, useEffect } from 'react'
import { useLayout } from '../../context/LayoutContext'
import StatusBadge from '../../components/common/StatusBadge'

const INITIAL_COLIS = [
  { id: 'BC-2026-0142', fournisseur: 'ALFATRON', date: '05/10/2026', nbColis: 4, statut: 'a_valider' },
  { id: 'BC-2026-0140', fournisseur: 'Huawei', date: '02/10/2026', nbColis: 2, statut: 'a_valider' },
  { id: 'BC-2026-0139', fournisseur: 'Siemens AG', date: '18/09/2026', nbColis: 6, statut: 'livré' },
]

export default function ReceptionColis() {
  const { setSubtitle } = useLayout()
  const [colis, setColis] = useState(INITIAL_COLIS)

  useEffect(() => {
    setSubtitle('Confirmer la réception des colis livrés')
  }, [setSubtitle])

  const valider = (id) => {
    setColis((prev) => prev.map((c) => (c.id === id ? { ...c, statut: 'livré' } : c)))
  }

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="card-header">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Colis en attente de validation
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 dark:bg-gradient-to-b dark:from-[#1a2b4a] dark:to-[#0d1730] dark:border-[#1e293b]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">N° BC</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Fournisseur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Date réception (acheteur)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Nb colis</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/60 dark:divide-[#334155]/40">
              {colis.map((c) => (
                <tr key={c.id} className="align-middle transition-colors even:bg-gray-50/60 hover:bg-gray-50 dark:even:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                  <td className="px-4 py-3 font-semibold text-gray-800">{c.id}</td>
                  <td className="px-4 py-3 text-gray-700">{c.fournisseur}</td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums">{c.date}</td>
                  <td className="px-4 py-3 text-gray-700">{c.nbColis}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.statut} /></td>
                  <td className="px-4 py-3">
                    {c.statut === 'a_valider' ? (
                      <button
                        type="button"
                        onClick={() => valider(c.id)}
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: 13 }}
                      >
                        Valider la réception
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 13 }}
                        disabled
                      >
                        Validé
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
