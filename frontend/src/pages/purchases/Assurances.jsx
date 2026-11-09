import { useState, useEffect, useMemo } from 'react'
import { useLayout } from '../../context/LayoutContext'
import FormField from '../../components/common/FormField'

const INITIAL_ASSURANCES = [
  { id: 'ALFATRON', fournisseur: 'ALFATRON', type: 'Tous risques', incoterm: 'CIF — vendeur', compagnie: 'CAAT', police: 'POL-2026-0142', statut: 'active' },
  { id: 'Paper & Co', fournisseur: 'Paper & Co', type: 'Assurance aérienne', incoterm: 'CIP — vendeur', compagnie: 'Alliance Assurances', police: 'POL-2026-0143', statut: 'active' },
  { id: 'Câblerie El-Djazaïr', fournisseur: 'Câblerie El-Djazaïr', type: 'Assurance terrestre', incoterm: 'DAP — vendeur', compagnie: '', police: '', statut: 'a_definir' },
  { id: 'Huawei', fournisseur: 'Huawei', type: 'Assurance aérienne', incoterm: 'CIP — vendeur', compagnie: 'CAAR', police: 'POL-2026-0140', statut: 'active' },
  { id: 'Siemens AG', fournisseur: 'Siemens AG', type: 'Tous risques', incoterm: 'CIF — vendeur', compagnie: 'SAA', police: 'POL-2026-0139', statut: 'active' },
  { id: 'Nokia', fournisseur: 'Nokia', type: 'FAP Sauf', incoterm: 'FOB — acheteur', compagnie: 'CASH Assurances', police: 'POL-2026-0137', statut: 'expiree' },
]

const TYPE_OPTIONS = [
  { value: 'Tous risques', label: 'Tous risques' },
  { value: 'FAP Sauf', label: 'FAP Sauf' },
  { value: 'Assurance aérienne', label: 'Assurance aérienne' },
  { value: 'Assurance terrestre', label: 'Assurance terrestre' },
]

const INCOTERM_OPTIONS = [
  { value: 'CIF — vendeur', label: 'CIF — vendeur' },
  { value: 'FOB — acheteur', label: 'FOB — acheteur' },
  { value: 'CIP — vendeur', label: 'CIP — vendeur' },
  { value: 'DAP — vendeur', label: 'DAP — vendeur' },
]

const COMPAGNIE_OPTIONS = [
  { value: 'CAAT', label: 'CAAT — Compagnie Algérienne des Transports' },
  { value: 'SAA', label: "SAA — Société Nationale d'Assurance" },
  { value: 'CAAR', label: 'CAAR — Compagnie Algérienne des Assurances' },
  { value: 'Alliance Assurances', label: 'Alliance Assurances' },
  { value: 'CASH Assurances', label: 'CASH Assurances' },
  { value: '2A (Al Amane)', label: '2A (Al Amane)' },
]

const STATUT_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'a_definir', label: 'À définir' },
  { value: 'expiree', label: 'Expirée' },
]

const STATUT_BADGES = {
  active: { label: 'Active', cls: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25' },
  a_definir: { label: 'À définir', cls: 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 shadow-sm dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25' },
  expiree: { label: 'Expirée', cls: 'bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/30 shadow-sm dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25' },
}

export default function Assurances() {
  const { setSubtitle } = useLayout()
  const [assurances, setAssurances] = useState(INITIAL_ASSURANCES)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ type: '', incoterm: '', compagnie: '', police: '', statut: 'active' })

  useEffect(() => {
    setSubtitle('Une assurance par fournisseur')
  }, [setSubtitle])

  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!q) return assurances
    return assurances.filter((a) => a.fournisseur.toLowerCase().includes(q))
  }, [q, assurances])

  const editing = assurances.find((a) => a.id === editingId)

  const openEdit = (a) => {
    setEditingId(a.id)
    setForm({
      type: a.type,
      incoterm: a.incoterm,
      compagnie: a.compagnie,
      police: a.police,
      statut: a.statut,
    })
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = () => {
    setAssurances((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...form } : a)))
    setEditingId(null)
  }

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
            placeholder="Rechercher un fournisseur…"
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Fournisseur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Type d'assurance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Incoterm</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Compagnie</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">N° police</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-blue-100/70">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/60 dark:divide-[#334155]/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Aucun fournisseur trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const s = STATUT_BADGES[a.statut] || { label: a.statut, cls: 'bg-gray-500/10 text-gray-700 ring-1 ring-gray-400/30 dark:text-gray-300' }
                  return (
                    <tr
                      key={a.id}
                      className="align-middle transition-colors even:bg-gray-50/60 hover:bg-gray-50 dark:even:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{a.fournisseur}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{a.type}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{a.incoterm}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{a.compagnie || '—'}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200 tabular-nums">{a.police || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openEdit(a)}
                          className="text-blue-600 hover:text-blue-500 dark:text-[#93bbfd] dark:hover:text-[#bfdbfe] text-sm font-medium transition-colors"
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingId(null)} />
          <div className="relative bg-white dark:bg-[#101a38] rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1e293b] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-navy dark:text-white">
                Assurance — {editing.fournisseur}
              </h2>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Type d'assurance"
                  name="type"
                  type="select"
                  value={form.type}
                  onChange={handleChange}
                  options={TYPE_OPTIONS}
                />
                <FormField
                  label="Incoterm / responsabilité"
                  name="incoterm"
                  type="select"
                  value={form.incoterm}
                  onChange={handleChange}
                  options={INCOTERM_OPTIONS}
                />
                <FormField
                  label="Compagnie"
                  name="compagnie"
                  type="select"
                  value={form.compagnie}
                  onChange={handleChange}
                  options={COMPAGNIE_OPTIONS}
                />
                <FormField
                  label="N° police"
                  name="police"
                  value={form.police}
                  onChange={handleChange}
                  placeholder="Ex. POL-2026-XXXX"
                />
                <div className="md:col-span-2">
                  <FormField
                    label="Statut"
                    name="statut"
                    type="select"
                    value={form.statut}
                    onChange={handleChange}
                    options={STATUT_OPTIONS}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>
                  Annuler
                </button>
                <button type="button" className="btn-primary" onClick={handleSave}>
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
