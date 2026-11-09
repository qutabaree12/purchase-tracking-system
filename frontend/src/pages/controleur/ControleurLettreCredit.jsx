import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLayout } from '../../context/LayoutContext'
import { useControleur } from './ControleurContext'
import Select from '../../components/common/Select'
import { generateLcPdf, downloadLcPdf, documentsChoisis } from '../../utils/lcPdf'

const FORM_VIDE = {
  referenceCredit: '',
  banque: '',
  dateEmission: '',
  donneurOrdre: 'Algérie Télécom',
  beneficiaire: 'Algérie Télécom',
  adresseBeneficiaire: 'Direction Générale — Alger',
  typeCredit: 'Crédit documentaire irrévocable — payable à vue',
  montant: '',
  devise: 'DZD',
  montantLettres: '',
  objet: '',
  paysOrigine: '',
  lieuLivraison: '',
  dateLimiteExpedition: '',
  dateExpiration: '',
  lieuExpiration: '',
  regles: 'RUU 600 (à confirmer par la banque)',
  documents: {
    facture: true,
    transport: true,
    colisage: true,
    origine: true,
    reception: false,
    autre: false,
  },
  autreDocument: '',
  conditionsPaiement:
    'Le paiement serait effectué conformément aux modalités du crédit documentaire et après examen des documents présentés par le bénéficiaire. Toute condition définitive doit être rédigée et approuvée par la banque émettrice.',
  signataireDemandeur: '',
  dateSignatureDemandeur: '',
  signataireBanque: '',
  signataireBeneficiaire: '',
}

const DOCUMENTS_LABELS = {
  facture: 'Facture commerciale',
  transport: 'Bon de livraison / document de transport',
  colisage: 'Liste de colisage',
  origine: "Certificat d'origine",
  reception: 'Procès-verbal de réception / attestation de service fait',
  autre: 'Autre document',
}

const BANQUES = [
  'Banque Nationale d’Algérie (BNA)',
  'Banque Extérieure d’Algérie (BEA)',
  'Crédit Populaire d’Algérie (CPA)',
  'Banque de l’Agriculture et du Développement Rural (BADR)',
  'Banque de Développement Local (BDL)',
  'CNEP-Banque',
  'Société Générale Algérie',
  'BNP Paribas El Djazaïr',
  'Natixis Algérie',
  'Al Salam Bank Algeria',
  'Arab Banking Corporation Algeria (ABC)',
  'Gulf Bank Algeria (AGB)',
  'Trust Bank Algeria',
]

const ADRESSES_BENEFICIAIRE = [
  'Direction Générale — Alger',
  'DOT Alger',
  'DOT Oran',
  'DOT Constantine',
  'DOT Annaba',
  'DOT Blida',
  'DOT Sétif',
  'DOT Tlemcen',
  'DOT Béjaïa',
  'DOT Ouargla',
  'DOT Ghardaïa',
]

const TYPES_CREDIT = [
  'Crédit documentaire irrévocable — payable à vue',
  'Crédit documentaire irrévocable — payable à échéance',
  'Crédit documentaire irrévocable — à vue, confirmé',
  'Crédit documentaire irrévocable — différé, confirmé',
  'Crédit documentaire transférable',
  'Lettre de crédit stand-by',
  'Crédit documentaire révocable',
]

const OBJETS = [
  'Acquisition d’équipements de transmission optique',
  'Acquisition de cartes et modules SFP',
  'Acquisition de routeurs et switchs',
  'Acquisition de câbles fibre optique',
  'Acquisition d’équipements de commutation téléphonique',
  'Acquisition d’antennes et équipements radio',
  'Acquisition de serveurs et équipements datacenter',
  'Acquisition de matériel de téléphonie IP',
  'Acquisition de compteurs et équipements de mesure réseau',
  'Travaux d’installation des équipements',
  'Maintenance préventive et curative des équipements',
  'Licences logicielles et abonnements',
  'Prestations d’intégration et de formation',
]

const LIEUX_LIVRAISON = [
  'Direction Générale — Alger',
  'Entrepôt principal — Alger',
  'DOT Alger',
  'DOT Oran',
  'DOT Constantine',
  'DOT Annaba',
  'DOT Blida',
  'DOT Sétif',
  'DOT Tlemcen',
  'DOT Béjaïa',
  'DOT Ouargla',
  'DOT Ghardaïa',
]

function avecValeur(liste, valeur) {
  if (!valeur || liste.includes(valeur)) return liste
  return [...liste, valeur]
}

function prochaineReference(dossiers) {
  const annee = new Date().getFullYear()
  const prefixe = `LC-${annee}-`
  const max = dossiers.reduce((acc, dossier) => {
    const reference = String(dossier.numero_lc || '')
    if (!reference.startsWith(prefixe)) return acc
    const numero = Number.parseInt(reference.slice(prefixe.length), 10)
    return Number.isFinite(numero) ? Math.max(acc, numero) : acc
  }, 0)
  return `${prefixe}${String(max + 1).padStart(4, '0')}`
}

function montantNumerique(montant) {
  if (montant == null) return ''
  return String(montant).replace(/[^\d.,]/g, '')
}

function depuisDossier(dossier, dossiers = []) {
  if (!dossier) return { ...FORM_VIDE, referenceCredit: prochaineReference(dossiers) }

  return {
    ...FORM_VIDE,
    referenceCredit: dossier.numero_lc || prochaineReference(dossiers),
    banque: dossier.banque_lc || '',
    dateEmission: dossier.date_lc || '',
    montant: montantNumerique(dossier.montant),
    lieuLivraison: dossier.lieu_chargement || '',
    dateLimiteExpedition: dossier.date_livraison_prevue || '',
  }
}

function dateFr(value) {
  if (!value) return '—'
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('fr-FR')
}

function formatMontant(montant) {
  const cleaned = String(montant ?? '').replace(/\s/g, '')
  if (!cleaned) return '—'
  const nombre = Number(cleaned.replace(',', '.'))
  return Number.isFinite(nombre) ? nombre.toLocaleString('fr-FR') : cleaned
}

function moyenPaiement(typeCredit) {
  const type = String(typeCredit || '').toLowerCase()
  if (type.includes('à vue') || type.includes('a vue')) return 'À vue'
  if (type.includes('échéance') || type.includes('echeance') || type.includes('différé') || type.includes('differe')) {
    return 'À échéance'
  }
  return '—'
}

function SectionTitre({ numero, titre }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[11px] font-semibold text-[#008C95]">{numero}</span>
      <span className="text-[12px] font-bold uppercase tracking-wide text-[#16324F]">{titre}</span>
    </div>
  )
}

export default function ControleurLettreCredit() {
  const { setSubtitle } = useLayout()
  const { dossiers } = useControleur()
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState(FORM_VIDE)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    setSubtitle('Génération de la lettre de crédit')
  }, [setSubtitle])

  useEffect(() => {
    if (selectedId || dossiers.length === 0) return
    const dossier = dossiers.find((d) => d.numero_lc) || dossiers[0]
    setSelectedId(String(dossier.id_dossier))
    setForm(depuisDossier(dossier, dossiers))
  }, [dossiers, selectedId])

  const setField = (name) => (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const choisirDossier = (event) => {
    const { value } = event.target
    setSelectedId(value)
    const dossier = dossiers.find((d) => String(d.id_dossier) === value)
    setForm(depuisDossier(dossier, dossiers))
  }

  const toggleDocument = (key) => {
    setForm((current) => ({
      ...current,
      documents: { ...current.documents, [key]: !current.documents[key] },
    }))
  }

  const telecharger = async () => {
    setDownloading(true)
    try {
      const bytes = await generateLcPdf(form)
      const nom = (form.referenceCredit || 'lettre-de-credit').replace(/[^\w.-]+/g, '-')
      downloadLcPdf(bytes, `${nom}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  const documents = documentsChoisis(form)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Dossier</label>
          <Select
            value={selectedId}
            onChange={choisirDossier}
            options={dossiers.map((d) => ({
              value: String(d.id_dossier),
              label: `${d.bc} · ${d.fournisseur} · ${d.statut_controle}`,
            }))}
            placeholder="Choisir un dossier..."
            className="min-w-[260px]"
          />
        </div>
        <Link to="/controleur/lettres" className="btn-secondary">
          Retour aux lettres
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-brand-navy dark:text-white">Parties</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm mb-1">Banque émettrice</label>
                <Select
                  value={form.banque}
                  onChange={setField('banque')}
                  options={avecValeur(BANQUES, form.banque).map((banque) => ({ value: banque, label: banque }))}
                  placeholder="Sélectionner une banque..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Demandeur / Donneur d'ordre</label>
                <input className="input w-full" value={form.donneurOrdre} onChange={setField('donneurOrdre')} />
              </div>
              <div>
                <label className="block text-sm mb-1">Bénéficiaire</label>
                <input
                  className="input w-full bg-gray-100 dark:bg-white/5 cursor-not-allowed"
                  value={form.beneficiaire}
                  readOnly
                />
                <p className="text-[11px] text-gray-500 mt-1">Bénéficiaire fixé par le modèle — non modifiable.</p>
              </div>
              <div>
                <label className="block text-sm mb-1">Adresse du bénéficiaire</label>
                <Select
                  value={form.adresseBeneficiaire}
                  onChange={setField('adresseBeneficiaire')}
                  options={avecValeur(ADRESSES_BENEFICIAIRE, form.adresseBeneficiaire).map((adresse) => ({ value: adresse, label: adresse }))}
                  placeholder="Sélectionner une adresse..."
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-brand-navy dark:text-white">Lettre de crédit</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm mb-1">Référence du crédit documentaire</label>
                <input className="input w-full bg-gray-100 dark:bg-white/5 cursor-not-allowed" value={form.referenceCredit} readOnly />
                <p className="text-[11px] text-gray-500 mt-1">Identifiant unique et séquentiel, généré automatiquement — non modifiable.</p>
              </div>
              <div>
                <label className="block text-sm mb-1">Date d'émission</label>
                <input type="date" className="input w-full" value={form.dateEmission} onChange={setField('dateEmission')} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Type de crédit</label>
                <Select
                  value={form.typeCredit}
                  onChange={setField('typeCredit')}
                  options={avecValeur(TYPES_CREDIT, form.typeCredit).map((type) => ({ value: type, label: type }))}
                  placeholder="Sélectionner un type de crédit..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Montant</label>
                <input className="input w-full" value={form.montant} onChange={setField('montant')} placeholder="Montant en chiffres" />
              </div>
              <div>
                <label className="block text-sm mb-1">Devise</label>
                <Select
                  value={form.devise}
                  onChange={setField('devise')}
                  options={[
                    { value: 'DZD', label: 'DZD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'USD', label: 'USD' },
                    { value: 'GBP', label: 'GBP' },
                  ]}
                  className="w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Montant en lettres</label>
                <input className="input w-full" value={form.montantLettres} onChange={setField('montantLettres')} placeholder="Montant en toutes lettres" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Objet / Marchandises ou prestations</label>
                <Select
                  value={form.objet}
                  onChange={setField('objet')}
                  options={avecValeur(OBJETS, form.objet).map((objet) => ({ value: objet, label: objet }))}
                  placeholder="Sélectionner l'objet..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Pays d'expédition / d'origine</label>
                <input className="input w-full" value={form.paysOrigine} onChange={setField('paysOrigine')} />
              </div>
              <div>
                <label className="block text-sm mb-1">Lieu de livraison</label>
                <Select
                  value={form.lieuLivraison}
                  onChange={setField('lieuLivraison')}
                  options={avecValeur(LIEUX_LIVRAISON, form.lieuLivraison).map((lieu) => ({ value: lieu, label: lieu }))}
                  placeholder="Sélectionner un lieu..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Date limite d'expédition / exécution</label>
                <input type="date" className="input w-full" value={form.dateLimiteExpedition} onChange={setField('dateLimiteExpedition')} />
              </div>
              <div>
                <label className="block text-sm mb-1">Date d'expiration</label>
                <input type="date" className="input w-full" value={form.dateExpiration} onChange={setField('dateExpiration')} />
              </div>
              <div>
                <label className="block text-sm mb-1">Lieu d'expiration</label>
                <input className="input w-full" value={form.lieuExpiration} onChange={setField('lieuExpiration')} />
              </div>
              <div>
                <label className="block text-sm mb-1">Règles applicables</label>
                <input className="input w-full" value={form.regles} onChange={setField('regles')} />
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-brand-navy dark:text-white">Documents à présenter</h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {Object.entries(DOCUMENTS_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.documents[key]} onChange={() => toggleDocument(key)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {form.documents.autre && (
              <div>
                <label className="block text-sm mb-1">Précision du document « autre »</label>
                <input className="input w-full" value={form.autreDocument} onChange={setField('autreDocument')} placeholder="Ex. certificat d'assurance" />
              </div>
            )}
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-brand-navy dark:text-white">Conditions de paiement</h3>
            <textarea className="input w-full" rows={4} value={form.conditionsPaiement} onChange={setField('conditionsPaiement')} />
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={telecharger} disabled={downloading}>
              {downloading ? 'Génération...' : 'Télécharger le PDF'}
            </button>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="xl:sticky xl:top-4">
            <div className="rounded-xl overflow-hidden bg-white text-gray-800 shadow-lg ring-1 ring-gray-200 max-h-[85vh] overflow-y-auto">
              <div className="bg-[#16324F] px-8 pt-6 pb-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold tracking-wide">ALGÉRIE TÉLÉCOM</p>
                    <p className="text-[11px] text-white/80">Suivi du processus d'achat télécom</p>
                  </div>
                  <div className="text-right text-[11px] leading-5">
                    <p className="font-semibold">RÉF. {form.referenceCredit || '—'}</p>
                    <p className="text-white/80">Émission : {dateFr(form.dateEmission)}</p>
                  </div>
                </div>
                <p className="mt-6 text-2xl font-bold tracking-wide">LETTRE DE CRÉDIT</p>
              </div>
              <div className="h-1 bg-[#008C95]" />

              <div className="px-8 py-6 space-y-6">
                <div>
                  <SectionTitre numero="01" titre="PARTIES AU CRÉDIT" />
                  <div className="mt-2 divide-y divide-gray-100">
                    {[
                      ['Banque émettrice', form.banque],
                      ['Demandeur / donneur d’ordre', form.donneurOrdre],
                      ['Bénéficiaire', form.beneficiaire],
                      ['Adresse du bénéficiaire', form.adresseBeneficiaire],
                    ].map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[180px_1fr] gap-4 py-2">
                        <span className="text-[11px] text-gray-500">{label}</span>
                        <span className="text-[13px] text-gray-800">{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <SectionTitre numero="02" titre="CARACTÉRISTIQUES ET OBJET" />
                  <div className="mt-2 divide-y divide-gray-100">
                    {[
                      ['Type de crédit', form.typeCredit],
                      ['Objet / marchandises', form.objet],
                      ['Pays d’expédition / d’origine', form.paysOrigine],
                      ['Lieu de livraison', form.lieuLivraison],
                      ['Date limite d’expédition', form.dateLimiteExpedition ? dateFr(form.dateLimiteExpedition) : ''],
                      ['Date et lieu d’expiration', form.dateExpiration ? `${dateFr(form.dateExpiration)}${form.lieuExpiration ? ` — ${form.lieuExpiration}` : ''}` : ''],
                      ['Règles applicables', form.regles],
                    ].map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[180px_1fr] gap-4 py-2">
                        <span className="text-[11px] text-gray-500">{label}</span>
                        <span className="text-[13px] text-gray-800">{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <SectionTitre numero="03" titre="DOCUMENTS À PRÉSENTER" />
                  {documents.length === 0 ? (
                    <p className="mt-2 text-[12px] text-gray-500">Aucun document sélectionné.</p>
                  ) : (
                    <ol className="mt-2 space-y-1.5">
                      {documents.map((document, index) => (
                        <li key={document} className="flex gap-3 text-[12px] text-gray-700">
                          <span className="font-semibold text-[#008C95]">{String(index + 1).padStart(2, '0')}</span>
                          <span>{document}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Montant du crédit</p>
                    <p className="text-2xl font-bold text-gray-900">{formatMontant(form.montant)} {form.devise}</p>
                    <p className="text-[11px] text-gray-500">{form.montantLettres || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Paiement</p>
                    <p className="text-lg font-semibold text-gray-900">{moyenPaiement(form.typeCredit)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Expiration</p>
                    <p className="text-lg font-semibold text-gray-900">{dateFr(form.dateExpiration)}</p>
                  </div>
                </div>

                <div>
                  <SectionTitre numero="04" titre="CONDITIONS DE PAIEMENT" />
                  <p className="mt-2 text-[12px] text-gray-700 whitespace-pre-line">{form.conditionsPaiement || '—'}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Signatures / validation</p>
                  <div className="mt-8 grid grid-cols-3 gap-4 text-[10px]">
                    {[
                      ['Demandeur', ''],
                      ['Banque émettrice', 'Réservé à la banque'],
                      ['Bénéficiaire', 'Le cas échéant'],
                    ].map(([role, sub]) => (
                      <div key={role} className="border-t border-gray-400 pt-2">
                        <p className="font-medium text-gray-700">{role}</p>
                        {sub && <p className="text-gray-500">{sub}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#008C95] px-8 py-3 flex items-center justify-between text-[10px] text-gray-500">
                <span>{form.referenceCredit || '—'} | Algérie Télécom</span>
                <span>Page 1 / 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
