import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLayout } from '../../context/LayoutContext'
import { useControleur } from './ControleurContext'

const KPI_TONES = {
  violet: 'bg-violet-500/10 text-violet-700 ring-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/25',
  amber: 'bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25',
  emerald: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25',
  blue: 'bg-blue-500/10 text-blue-700 ring-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25',
}

function Kpi({ label, value, tone, onClick }) {
  return (
    <div
      className={`rounded-2xl p-5 ring-1 shadow-sm ${KPI_TONES[tone] || KPI_TONES.blue} ${onClick ? 'cursor-pointer hover:brightness-95 transition' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      <p className="text-[12px] font-semibold uppercase tracking-wide opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}

function StatutBadge({ statut }) {
  if (statut === 'verifie') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25">
        Vérifié
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 shadow-sm dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25">
      À vérifier
    </span>
  )
}

export default function ControleurDashboard() {
  const { setSubtitle } = useLayout()
  const navigate = useNavigate()
  const { dossiers, lettres } = useControleur()

  useEffect(() => {
    setSubtitle("Vérification des dossiers d'achat")
  }, [setSubtitle])

  const aVerifier = dossiers.filter((d) => d.statut === 'a_verifier')
  const verifies = dossiers.filter((d) => d.statut === 'verifie')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Kpi label="Total dossier" value={dossiers.length} tone="violet" onClick={() => navigate('/controleur/dossiers')} />
      <Kpi label="À vérifier" value={aVerifier.length} tone="amber" onClick={() => navigate('/controleur/dossiers')} />
      <Kpi label="Vérifiés" value={verifies.length} tone="emerald" onClick={() => navigate('/controleur/verifies')} />
      <Kpi label="Lettres de crédit" value={lettres.length} tone="blue" onClick={() => navigate('/controleur/lettres')} />
      </div>

      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Dossiers en attente de vérification
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: 13 }}
            onClick={() => navigate('/controleur/dossiers')}
          >
            Voir tout
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 dark:bg-gradient-to-b dark:from-[#1a2b4a] dark:to-[#0d1730] dark:border-[#1e293b]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">N° BC</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Fournisseur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">DA liée</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/60 dark:divide-[#334155]/40">
              {aVerifier.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucun dossier en attente</td>
                </tr>
              ) : (
                aVerifier.map((d) => (
                  <tr key={d.bc} className="align-middle transition-colors even:bg-gray-50/60 hover:bg-gray-50 dark:even:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{d.bc}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{d.fournisseur}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 tabular-nums">{d.da}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 tabular-nums">{d.montant}</td>
                    <td className="px-4 py-3"><StatutBadge statut={d.statut} /></td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => navigate('/controleur/dossiers')}
                        className="text-blue-600 hover:text-blue-500 dark:text-[#93bbfd] dark:hover:text-[#bfdbfe] text-sm font-medium transition-colors"
                      >
                        Vérifier
                      </button>
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
