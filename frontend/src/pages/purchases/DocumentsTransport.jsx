import { useState, useEffect, useMemo } from 'react'
import { useLayout } from '../../context/LayoutContext'
import FormField from '../../components/common/FormField'

export const DOSSIERS = [
  {
    id: 'BC-2026-0142',
    fournisseur: 'ALFATRON',
    mode: 'Maritime',
    coherence: '1 écart détecté',
    docs: [
      { nom: 'Lettre de transport maritime', type: 'Sea Waybill', status: 'fourni', taille: '180 Ko', date: '22/09/2026', coh: 'ok',
        champs: [['N° document', 'SWB-0142-8841'], ['Navire', 'MSC ORCHESTRA'], ['Port de départ', 'Marseille, France'], ["Port d'arrivée", 'Alger'], ['Chargeur', 'ALFATRON'], ['Destinataire', 'Algérie Télécom']] },
      { nom: 'Facture commerciale', type: 'Commercial invoice', status: 'fourni', taille: '240 Ko', date: '22/09/2026', coh: 'ok',
        champs: [['N° facture', 'INV-2026-8841'], ['Émetteur', 'ALFATRON'], ['Destinataire', 'Algérie Télécom'], ['Montant', '425 000 DZD'], ['Incoterm', 'CIF Alger']] },
      { nom: 'Liste de colisage', type: 'Packing list', status: 'fourni', taille: '90 Ko', date: '22/09/2026', coh: 'ecart',
        champs: [['N° colis', '4 colis — 1 palette'], ['Poids brut', '210 kg'], ['Poids net', '195 kg'], ['Volume', '1,8 m³'], ['Contenu', 'PC, claviers, souris'], ['Écart', 'Qté 14 vs BC 15 (1 souris)']] },
      { nom: "Certificat d'origine", type: 'Certificate of origin', status: 'manquant', taille: '', date: '', coh: null, champs: [] },
      { nom: 'Connaissement (B/L)', type: 'Bill of lading', status: 'fourni', taille: '320 Ko', date: '23/09/2026', coh: 'ok',
        champs: [['N° B/L', 'BL-MSC-884102'], ['Transporteur', 'MSC'], ['Port de chargement', 'Marseille'], ['Port de déchargement', 'Alger'], ['Conteneur', "1 × 20' GP"], ['Marchandise', 'Équipement informatique']] },
    ],
  },
  {
    id: 'BC-2026-0143',
    fournisseur: 'Paper & Co',
    mode: 'Aérien',
    coherence: 'Documents incomplets',
    docs: [
      { nom: 'Lettre de transport aérien', type: 'Air Waybill (AWB)', status: 'fourni', taille: '120 Ko', date: '24/09/2026', coh: 'ok',
        champs: [['N° AWB', 'AWB-125-8843'], ['Compagnie', 'Air Algérie Cargo'], ['Aéroport départ', 'CDG Paris'], ["Aéroport arrivée", 'Alger'], ['Poids', '12 kg'], ['Expéditeur', 'Paper & Co']] },
      { nom: 'Facture commerciale', type: 'Commercial invoice', status: 'fourni', taille: '60 Ko', date: '24/09/2026', coh: 'ok',
        champs: [['N° facture', 'INV-PC-2026-119'], ['Émetteur', 'Paper & Co'], ['Montant', '27 000 DZD'], ['Incoterm', 'CIP Alger']] },
      { nom: 'Liste de colisage', type: 'Packing list', status: 'manquant', taille: '', date: '', coh: null, champs: [] },
      { nom: "Certificat d'origine", type: 'Certificate of origin', status: 'manquant', taille: '', date: '', coh: null, champs: [] },
      { nom: 'Connaissement (AWB)', type: 'Air Waybill', status: 'fourni', taille: '120 Ko', date: '24/09/2026', coh: 'ok',
        champs: [['N° AWB', 'AWB-125-8843'], ['Transporteur', 'Air Algérie'], ['Destination', 'Alger'], ['Nbre de colis', '2']] },
    ],
  },
  {
    id: 'BC-2026-0144',
    fournisseur: 'Câblerie El-Djazaïr',
    mode: 'Terrestre',
    coherence: 'À vérifier',
    docs: [
      { nom: 'Lettre de transport terrestre', type: 'Lettre de voiture (CMR)', status: 'fourni', taille: '95 Ko', date: '25/09/2026', coh: 'ok',
        champs: [['N° CMR', 'CMR-8844-001'], ['Transporteur', 'SNTR'], ['Lieu de chargement', 'Oran'], ['Lieu de livraison', 'Alger'], ['Chargement', 'Câbles']] },
      { nom: 'Facture commerciale', type: 'Commercial invoice', status: 'a_verifier', taille: '70 Ko', date: '25/09/2026', coh: 'ecart',
        champs: [['N° facture', 'INV-CAB-8844'], ['Montant', '86 000 DZD'], ['Écart', 'Montant incohérent vs BC']] },
      { nom: 'Liste de colisage', type: 'Packing list', status: 'manquant', taille: '', date: '', coh: null, champs: [] },
      { nom: "Certificat d'origine", type: 'Certificate of origin', status: 'manquant', taille: '', date: '', coh: null, champs: [] },
      { nom: 'Connaissement (CMR)', type: 'Lettre de voiture', status: 'fourni', taille: '95 Ko', date: '25/09/2026', coh: 'ok',
        champs: [['N° CMR', 'CMR-8844-001'], ['Transporteur', 'SNTR'], ['Lieu de livraison', 'Alger']] },
    ],
  },
  {
    id: 'BC-2026-0140',
    fournisseur: 'Huawei',
    mode: 'Aérien',
    coherence: 'Complet — cohérent',
    docs: [
      { nom: 'Lettre de transport aérien', type: 'Air Waybill (AWB)', status: 'fourni', taille: '130 Ko', date: '21/09/2026', coh: 'ok',
        champs: [['N° AWB', 'AWB-776-0140'], ['Compagnie', 'Emirates SkyCargo'], ['Destination', 'Alger']] },
      { nom: 'Facture commerciale', type: 'Commercial invoice', status: 'fourni', taille: '85 Ko', date: '21/09/2026', coh: 'ok',
        champs: [['N° facture', 'INV-HW-0140'], ['Montant', '1 200 000 DZD']] },
      { nom: 'Liste de colisage', type: 'Packing list', status: 'fourni', taille: '45 Ko', date: '21/09/2026', coh: 'ok',
        champs: [['Poids', '18 kg'], ['Nbre de colis', '3']] },
      { nom: "Certificat d'origine", type: 'Certificate of origin', status: 'fourni', taille: '110 Ko', date: '21/09/2026', coh: 'ok',
        champs: [["Pays d'origine", 'Chine'], ['Émetteur', 'CCPIT']] },
      { nom: 'Connaissement (AWB)', type: 'Air Waybill', status: 'fourni', taille: '130 Ko', date: '21/09/2026', coh: 'ok',
        champs: [['N° AWB', 'AWB-776-0140'], ['Transporteur', 'Emirates SkyCargo']] },
    ],
  },
]

const STATUS = {
  fourni: { label: 'Fourni', cls: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25' },
  a_verifier: { label: 'À vérifier', cls: 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 shadow-sm dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25' },
  manquant: { label: 'Manquant', cls: 'bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/30 shadow-sm dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25' },
}

function Badge({ tone, children }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tone}`}>
      {children}
    </span>
  )
}

function FileIcon() {
  return (
    <svg
      className="w-5 h-5 text-brand-navy dark:text-white/80 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

export default function DocumentsTransport() {
  const { setSubtitle } = useLayout()
  const [dossiers, setDossiers] = useState(DOSSIERS)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(DOSSIERS[0].id)
  const [preview, setPreview] = useState(null)
  const [importTarget, setImportTarget] = useState(null)
  const [form, setForm] = useState({ numero: '', date: '', fichier: '' })
  const [formError, setFormError] = useState('')

  const q = search.trim().toLowerCase()
  const filteredDossiers = useMemo(() => {
    if (!q) return dossiers
    return dossiers.filter((d) =>
      `${d.id} ${d.fournisseur} ${d.mode}`.toLowerCase().includes(q)
    )
  }, [q, dossiers])

  const selected = filteredDossiers.find((d) => d.id === selectedId) || filteredDossiers[0]

  useEffect(() => {
    if (selected) {
      setSubtitle(`${selected.id} · ${selected.fournisseur} · ${selected.mode}`)
    }
  }, [selected, setSubtitle])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const openImport = (doc) => {
    setImportTarget({ dossierId: selected.id, docNom: doc.nom, docType: doc.type })
    setForm({ numero: '', date: '', fichier: '' })
    setFormError('')
  }

  const handleImportSubmit = () => {
    if (!form.numero.trim()) {
      setFormError('Le numéro du document est requis.')
      return
    }
    const dateDepot = form.date
      ? new Date(form.date).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR')
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id !== importTarget.dossierId) return d
        return {
          ...d,
          coherence: 'Complet — cohérent',
          docs: d.docs.map((x) =>
            x.nom === importTarget.docNom
              ? {
                  ...x,
                  status: 'fourni',
                  coh: 'ok',
                  date: dateDepot,
                  taille: '—',
                  champs: [
                    ['N° document', form.numero],
                    ['Date de dépôt', dateDepot],
                    ['Fichier', form.fichier || '—'],
                  ],
                }
              : x
          ),
        }
      })
    )
    setImportTarget(null)
  }

  if (!selected) {
    return (
      <div className="card">
        <div className="card-body text-center py-8 text-gray-500">Aucun dossier trouvé</div>
      </div>
    )
  }

  const fournis = selected.docs.filter((d) => d.status === 'fourni').length

  return (
    <div className="space-y-4">
      {/* Barre de filtrage — recherche par dossier (BC · fournisseur · mode) */}
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
            placeholder="Rechercher un BC, fournisseur, mode…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">
        {/* Colonne gauche : liste des dossiers */}
        <div className="space-y-2">
          {filteredDossiers.map((d) => {
            const manquants = d.docs.filter((x) => x.status === 'manquant').length
            const active = d.id === selected.id
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  active
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white border-brand-line text-gray-700 hover:bg-gray-50 dark:bg-[#101a38] dark:text-gray-200 dark:border-[#1e293b] dark:hover:bg-[#15224a]'
                }`}
              >
                <span className="block text-sm font-semibold truncate">
                  {d.id} · {d.fournisseur}
                </span>
                <span className={`block text-xs mt-0.5 ${active ? 'text-white/70' : 'text-gray-500'}`}>
                  {d.mode}
                </span>
                {manquants > 0 && (
                  <span
                    className={`inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                    }`}
                  >
                    {manquants} manquant{manquants > 1 ? 's' : ''}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Colonne droite : documents du dossier sélectionné */}
        <div className="card overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Documents de transport — {selected.id} · {selected.fournisseur} · {selected.mode}
            </span>
            <span className="text-xs font-semibold text-gray-500">
              {fournis}/{selected.docs.length} fournis · {selected.coherence}
            </span>
          </div>

          <div className="divide-y divide-gray-200/60 dark:divide-[#334155]/40">
            {selected.docs.map((doc) => {
              const meta = doc.status === 'fourni' || doc.status === 'a_verifier'
                ? `PDF · ${doc.taille} · déposé le ${doc.date}`
                : '—'
              const st = STATUS[doc.status]
              return (
                <div
                  key={doc.nom}
                  onClick={() => (doc.status === 'fourni' || doc.status === 'a_verifier') && setPreview({ dossier: selected, doc })}
                  className={`grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center px-6 py-3 transition-colors even:bg-gray-50/60 hover:bg-gray-50 dark:even:bg-white/[0.02] dark:hover:bg-white/[0.04] ${(doc.status === 'fourni' || doc.status === 'a_verifier') ? 'cursor-pointer' : ''}`}
                >                  {/* Milieu : document */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 shrink-0 rounded-lg bg-gray-100 dark:bg-[#15224a] flex items-center justify-center">
                      <FileIcon />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{doc.nom}</p>
                      <p className="text-xs text-gray-500 truncate">{doc.type} · {meta}</p>
                    </div>
                  </div>

                  {/* Droite : statuts + action */}
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    {doc.coh === 'ecart' && <Badge tone={STATUS.a_verifier.cls}>Écart de cohérence</Badge>}
                    {doc.coh === 'ok' && <Badge tone={STATUS.fourni.cls}>Cohérent</Badge>}
                    <Badge tone={st.cls}>{st.label}</Badge>
                    {doc.status === 'fourni' || doc.status === 'a_verifier' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreview({ dossier: selected, doc })
                        }}
                        className="text-blue-600 hover:text-blue-500 dark:text-[#93bbfd] dark:hover:text-[#bfdbfe] text-sm font-medium transition-colors"
                      >
                        Voir
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openImport(doc)
                        }}
                        className="text-blue-600 hover:text-blue-500 dark:text-[#93bbfd] dark:hover:text-[#bfdbfe] text-sm font-medium transition-colors"
                      >
                        Importer
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modale de visualisation du document */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreview(null)} />
          <div className="relative bg-white dark:bg-[#101a38] rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1e293b] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-navy dark:text-white">
                {preview.doc.nom} — {preview.dossier.id} · {preview.dossier.fournisseur}
              </h2>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-[#15224a] rounded-lg px-4 py-3 mb-4">
                <div><p className="text-[11px] text-gray-500">Bon de commande</p><p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{preview.dossier.id}</p></div>
                <div><p className="text-[11px] text-gray-500">Fournisseur</p><p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{preview.dossier.fournisseur}</p></div>
                <div><p className="text-[11px] text-gray-500">Type</p><p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{preview.doc.type}</p></div>
                <div><p className="text-[11px] text-gray-500">Mode</p><p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{preview.dossier.mode}</p></div>
              </div>

              {preview.doc.champs.length ? (
                <table className="w-full text-sm">
                  <tbody>
                    {preview.doc.champs.map(([k, v]) => (
                      <tr key={k} className="border-b border-gray-100 dark:border-[#1e293b] last:border-0">
                        <td className="py-2 pr-3 text-gray-500 font-medium w-2/5">{k}</td>
                        <td className="py-2 text-gray-800 dark:text-gray-200">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500">Aucun fichier fourni pour ce document.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modale d'importation d'un document (formulaire) */}
      {importTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setImportTarget(null)} />
          <div className="relative bg-white dark:bg-[#101a38] rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1e293b] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-navy dark:text-white">
                Importer un document — {importTarget.docNom}
              </h2>
              <button
                type="button"
                onClick={() => setImportTarget(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-gray-500 mb-4">
                {importTarget.dossierId} · {selected.fournisseur} · {importTarget.docType}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="N° document"
                  name="numero"
                  value={form.numero}
                  onChange={handleChange}
                  required
                  error={formError}
                />
                <FormField
                  label="Date d'émission"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                />
                <div className="md:col-span-2">
                  <FormField
                    label="Fichier (PDF)"
                    name="fichier"
                    value={form.fichier}
                    onChange={handleChange}
                    placeholder="Nom du fichier…"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="btn-secondary" onClick={() => setImportTarget(null)}>
                  Annuler
                </button>
                <button type="button" className="btn-primary" onClick={handleImportSubmit}>
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
