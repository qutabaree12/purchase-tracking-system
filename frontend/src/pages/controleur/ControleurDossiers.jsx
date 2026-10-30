
import { useState, useEffect } from 'react'
import { useLayout } from '../../context/LayoutContext'
import { useControleur } from './ControleurContext'

const AUTO_TONES = {
  blue: 'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25',
  gray: 'bg-gray-500/10 text-gray-700 ring-1 ring-gray-400/30 dark:bg-white/10 dark:text-gray-300 dark:ring-white/15',
}

export default function ControleurDossiers() {
  const { setSubtitle } = useLayout()
  const { dossiers, verifier, loading, error, saving } = useControleur()

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [decision, setDecision] = useState('valide')
  const [commentaire, setCommentaire] = useState('')
  const [numeroLc, setNumeroLc] = useState('')
  const [banqueLc, setBanqueLc] = useState('')
  const [dateLc, setDateLc] = useState('')

  useEffect(() => {
    setSubtitle('Contrôle du dossier complet (BC, tarifs, autorisations)')
  }, [setSubtitle])

  const q = search.trim().toLowerCase()

  const aVerifier = dossiers.filter(
    (d) =>
      d.statut_controle === 'a_verifier' &&
      (!q || `${d.bc || ''} ${d.fournisseur || ''}`.toLowerCase().includes(q))
  )

  const ouvrirDossier = (dossier) => {
    setSelected(dossier)
    setDecision('valide')
    setCommentaire('')
    setNumeroLc(dossier.numero_lc || '')
    setBanqueLc(dossier.banque_lc || '')
    setDateLc(dossier.date_lc || '')
  }

  const fermerDossier = () => {
    if (saving) return
    setSelected(null)
  }

  const generer = async () => {
    if (!selected || saving) return

    if (
      decision === 'valide' &&
      (!numeroLc.trim() || !banqueLc.trim() || !dateLc)
    ) {
      window.alert(
        'Pour valider, renseigne le numéro, la banque et la date de la lettre de crédit.'
      )
      return
    }

    if (decision === 'refuse' && !commentaire.trim()) {
      window.alert('Un commentaire est obligatoire en cas de refus.')
      return
    }

    try {
      await verifier(selected.id_dossier, {
        decision,
        commentaire: commentaire.trim(),
        numero_lc: decision === 'valide' ? numeroLc.trim() : '',
        banque_lc: decision === 'valide' ? banqueLc.trim() : '',
        date_lc: decision === 'valide' ? dateLc : null,
      })

      window.alert(
        decision === 'valide'
          ? 'Dossier validé et informations de la lettre de crédit enregistrées.'
          : 'Refus enregistré dans la base de données.'
      )

      setSelected(null)
      setDecision('valide')
      setCommentaire('')
      setNumeroLc('')
      setBanqueLc('')
      setDateLc('')
    } catch (err) {
      window.alert(err.message || 'Une erreur est survenue.')
    }
  }

  return (
    <div className="space-y-6">
      {loading && (
        <p className="text-sm text-gray-500">
          Chargement des dossiers...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

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
            placeholder="Rechercher un BC, fournisseur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Dossiers à vérifier
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 dark:bg-gradient-to-b dark:from-[#1a2b4a] dark:to-[#0d1730] dark:border-[#1e293b]">
                {[
                  'N° BC',
                  'Fournisseur',
                  'DA liée',
                  'Montant',
                  'Tarif douane',
                  'Autorisation',
                  'Action',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200/60 dark:divide-[#334155]/40">
              {!loading && aVerifier.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Aucun dossier à vérifier
                  </td>
                </tr>
              ) : (
                aVerifier.map((d) => (
                  <tr
                    key={d.id_dossier}
                    onClick={() => ouvrirDossier(d)}
                    className="align-middle cursor-pointer transition-colors even:bg-gray-50/60 hover:bg-gray-50 dark:even:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">
                      {d.bc}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {d.fournisseur}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 tabular-nums">
                      {d.da || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 tabular-nums">
                      {d.montant ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 tabular-nums">
                      {d.tarif ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          AUTO_TONES[d.autoState] || AUTO_TONES.gray
                        }`}
                      >
                        {d.auto || '—'}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => ouvrirDossier(d)}
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: 13 }}
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={fermerDossier}
          />

          <div className="relative bg-white dark:bg-[#101a38] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1e293b] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-navy dark:text-white">
                Vérification du dossier — {selected.bc}
              </h2>

              <button
                type="button"
                onClick={fermerDossier}
                disabled={saving}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-[#15224a] rounded-lg px-4 py-3 mb-4">
                <div>
                  <p className="text-[11px] text-gray-500">N° Bon de commande</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {selected.bc}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-gray-500">Demande d'achat</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {selected.da || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-gray-500">Fournisseur</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {selected.fournisseur}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-gray-500">Montant</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {selected.montant ?? '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-sm">
                <div>
                  <p className="text-[11px] text-gray-500">Mode d'expédition</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {selected.mode || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-gray-500">Lieu de chargement</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {selected.lieu || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-gray-500">Tarif douane</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {selected.tarif ?? '—'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-semibold text-brand-navy dark:text-white">
                  Décision du contrôleur
                </h3>

                <div>
                  <label className="block text-sm mb-1">
                    Décision
                  </label>
                  <select
                    className="input w-full"
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    disabled={saving}
                  >
                    <option value="valide">Valider le dossier</option>
                    <option value="refuse">Refuser le dossier</option>
                  </select>
                </div>

                {decision === 'valide' && (
                  <>
                    <div>
                      <label className="block text-sm mb-1">
                        Numéro de lettre de crédit
                      </label>
                      <input
                        className="input w-full"
                        value={numeroLc}
                        onChange={(e) => setNumeroLc(e.target.value)}
                        placeholder="Ex. LC-2026-0042"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">Banque</label>
                      <input
                        className="input w-full"
                        value={banqueLc}
                        onChange={(e) => setBanqueLc(e.target.value)}
                        placeholder="Nom de la banque"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">
                        Date de la lettre de crédit
                      </label>
                      <input
                        type="date"
                        className="input w-full"
                        value={dateLc}
                        onChange={(e) => setDateLc(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm mb-1">
                    Commentaire {decision === 'refuse' ? '(obligatoire)' : '(facultatif)'}
                  </label>
                  <textarea
                    className="input w-full"
                    rows={3}
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Observations du contrôleur..."
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={fermerDossier}
                  disabled={saving}
                >
                  Fermer
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={generer}
                  disabled={saving}
                >
                  {saving
                    ? 'Enregistrement...'
                    : decision === 'valide'
                      ? 'Valider et enregistrer'
                      : 'Confirmer le refus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
