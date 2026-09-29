import { createContext, useContext, useState } from 'react'

const ControleurContext = createContext(null)

export const INITIAL_DOSSIERS = [
  { bc: 'BC-2026-0142', fournisseur: 'ALFATRON', da: 'DA-2026-0001', montant: '425 000 DZD', tarif: '42 000 DZD', auto: 'Nécessaire — obtenue', autoState: 'blue', mode: 'Maritime', lieu: 'Marseille, France', statut: 'a_verifier' },
  { bc: 'BC-2026-0140', fournisseur: 'Huawei', da: 'DA-2026-0012', montant: '1 200 000 DZD', tarif: '33 400 DZD', auto: 'Aucune', autoState: 'gray', mode: 'Aérien', lieu: 'Shenzhen, Chine', statut: 'a_verifier' },
  { bc: 'BC-2026-0143', fournisseur: 'Paper & Co', da: 'DA-2026-0015', montant: '27 000 DZD', tarif: '8 600 DZD', auto: 'Aucune', autoState: 'gray', mode: 'Aérien', lieu: 'Paris, France', statut: 'a_verifier' },
  { bc: 'BC-2026-0139', fournisseur: 'Siemens AG', da: 'DA-2026-0009', montant: '980 000 DZD', tarif: '120 000 DZD', auto: 'Nécessaire — obtenue', autoState: 'blue', mode: 'Maritime', lieu: 'Hambourg, Allemagne', statut: 'verifie', dateVerif: '22/09/2026' },
]

export const INITIAL_LETTRES = [
  { numero: 'LC-2026-0041', bc: 'BC-2026-0139', fournisseur: 'Siemens AG', montant: '980 000 DZD', banque: 'BNA — Agence Alger Centre', date: '22/09/2026' },
]

export function ControleurProvider({ children }) {
  const [dossiers, setDossiers] = useState(INITIAL_DOSSIERS)
  const [lettres, setLettres] = useState(INITIAL_LETTRES)

  const verifier = (bc) => {
    const d = dossiers.find((x) => x.bc === bc)
    if (!d) return null
    const date = new Date().toLocaleDateString('fr-FR')
    const numero = 'LC-2026-' + String(42 + lettres.length).padStart(4, '0')
    setDossiers((prev) =>
      prev.map((x) => (x.bc === bc ? { ...x, statut: 'verifie', dateVerif: date } : x))
    )
    setLettres((prev) => [
      ...prev,
      { numero, bc: d.bc, fournisseur: d.fournisseur, montant: d.montant, banque: 'BNA — Agence Alger Centre', date },
    ])
    return numero
  }

  return (
    <ControleurContext.Provider value={{ dossiers, lettres, verifier }}>
      {children}
    </ControleurContext.Provider>
  )
}

export function useControleur() {
  const ctx = useContext(ControleurContext)
  if (!ctx) throw new Error('useControleur must be used within ControleurProvider')
  return ctx
}
