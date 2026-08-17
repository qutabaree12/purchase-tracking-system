const STORAGE_KEY = 'mock_demandes_v1'

const SEED_ARRIVING = [
  {
    id_da: 1,
    numero_da: 'DA-ALG-2026-001',
    dot: 'Alger-Centre',
    demandeur_nom: 'Sara Meziane',
    date_creation: '2026-07-20',
    objet: 'Renouvellement matériel réseau',
    statut: 'en_cours',
    has_bc: false,
    motif_refus: null,
    lignes: [
      { num_ligne_da: 1, designation: 'Fibre optique G.652D', qte: 500, prix_unit: '850.00' },
      { num_ligne_da: 2, designation: 'Connecteurs SC/APC', qte: 200, prix_unit: '120.00' },
      { num_ligne_da: 3, designation: 'Gaine de protection', qte: 100, prix_unit: '45.00' },
    ],
  },
  {
    id_da: 2,
    numero_da: 'DA-ALG-2026-002',
    dot: 'Oran',
    demandeur_nom: 'Yacine Haddad',
    date_creation: '2026-07-22',
    objet: 'Connecteurs réseau',
    statut: 'en_cours',
    has_bc: false,
    motif_refus: null,
    lignes: [
      { num_ligne_da: 1, designation: 'Connecteurs SC/APC', qte: 300, prix_unit: '120.00' },
    ],
  },
  {
    id_da: 3,
    numero_da: 'DA-ALG-2026-003',
    dot: 'Sétif',
    demandeur_nom: 'Amina Cherif',
    date_creation: '2026-07-25',
    objet: 'Câbles cuivre 50m',
    statut: 'en_cours',
    has_bc: false,
    motif_refus: null,
    lignes: [
      { num_ligne_da: 1, designation: 'Câble cuivre 50m', qte: 150, prix_unit: '320.00' },
    ],
  },
  {
    id_da: 4,
    numero_da: 'DA-ALG-2026-004',
    dot: 'Annaba',
    demandeur_nom: 'Karim Larbi',
    date_creation: '2026-07-27',
    objet: 'Outillage fibre optique',
    statut: 'en_cours',
    has_bc: false,
    motif_refus: null,
    lignes: [
      { num_ligne_da: 1, designation: 'Kit soudure fibre', qte: 10, prix_unit: '15000.00' },
    ],
  },
  {
    id_da: 5,
    numero_da: 'DA-ALG-2026-005',
    dot: 'Alger-Centre',
    demandeur_nom: 'Nadia Benali',
    date_creation: '2026-07-29',
    objet: 'Équipements de bureau',
    statut: 'refusee',
    has_bc: false,
    motif_refus: 'Budget insuffisant pour ce trimestre.',
    lignes: [
      { num_ligne_da: 1, designation: 'Imprimante laser A4', qte: 3, prix_unit: '45000.00' },
      { num_ligne_da: 2, designation: 'Poste de travail', qte: 5, prix_unit: '150000.00' },
    ],
  },
]

const SEED_APPROVED = [
  {
    id_da: 11,
    fournisseur_id: 1,
    numero_da: 'DA-ALG-2026-101',
    dot: 'Alger-Centre',
    demandeur_nom: 'Sara Meziane',
    date_creation: '2026-08-01',
    objet: 'Renouvellement matériel réseau',
    statut: 'approuvee',
    has_bc: false,
    motif_refus: null,
    lignes: [
      { num_ligne_da: 1, designation: 'Fibre optique G.652D', qte: 500, prix_unit: '850.00' },
      { num_ligne_da: 2, designation: 'Connecteurs SC/APC', qte: 200, prix_unit: '120.00' },
    ],
  },
  {
    id_da: 12,
    fournisseur_id: 2,
    numero_da: 'DA-ALG-2026-102',
    dot: 'Oran',
    demandeur_nom: 'Yacine Haddad',
    date_creation: '2026-08-03',
    objet: 'Connecteurs réseau',
    statut: 'approuvee',
    has_bc: true,
    motif_refus: null,
    lignes: [
      { num_ligne_da: 1, designation: 'Connecteurs SC/APC', qte: 300, prix_unit: '120.00' },
    ],
  },
  {
    id_da: 13,
    fournisseur_id: 4,
    numero_da: 'DA-ALG-2026-103',
    dot: 'Sétif',
    demandeur_nom: 'Amina Cherif',
    date_creation: '2026-08-05',
    objet: 'Câbles cuivre 50m',
    statut: 'approuvee',
    has_bc: false,
    motif_refus: null,
    lignes: [
      { num_ligne_da: 1, designation: 'Câble cuivre 50m', qte: 150, prix_unit: '320.00' },
    ],
  },
  {
    id_da: 14,
    fournisseur_id: 5,
    numero_da: 'DA-ALG-2026-104',
    dot: 'Alger-Centre',
    demandeur_nom: 'Karim Larbi',
    date_creation: '2026-08-08',
    objet: 'Serveurs de production',
    statut: 'approuvee',
    has_bc: true,
    motif_refus: null,
    lignes: [
      { num_ligne_da: 1, designation: 'Serveur rack 2U', qte: 2, prix_unit: '850000.00' },
      { num_ligne_da: 2, designation: 'Disque SSD 1TB', qte: 8, prix_unit: '25000.00' },
    ],
  },
]

function seed() {
  return {
    arriving: SEED_ARRIVING.map((d) => ({ ...d, lignes: [...d.lignes] })),
    approved: SEED_APPROVED.map((d) => ({ ...d, lignes: [...d.lignes] })),
    bons: [],
  }
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.arriving) && Array.isArray(parsed.approved)) {
        if (!Array.isArray(parsed.bons)) parsed.bons = []
        return parsed
      }
    }
  } catch {}
  const data = seed()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
  return data
}

function writeStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function assignToUser(demande, user) {
  return {
    ...demande,
    id_acheteur: user?.id_emp ?? demande.id_acheteur,
    acheteur_nom: user?.full_name ?? demande.acheteur_nom,
  }
}

export function getMockArriving(user) {
  return readStore().arriving.map((d) => assignToUser(d, user))
}

export function getMockApproved(user) {
  return readStore().approved.map((d) => assignToUser(d, user))
}

export function mockApprouver(id, user) {
  const store = readStore()
  const idx = store.arriving.findIndex((d) => d.id_da === Number(id))
  if (idx === -1) return false
  const [demande] = store.arriving.splice(idx, 1)
  const updated = { ...demande, statut: 'approuvee' }
  store.approved.push(assignToUser(updated, user))
  writeStore(store)
  return true
}

export function mockRejeter(id, motif) {
  const store = readStore()
  const demande = store.arriving.find((d) => d.id_da === Number(id))
  if (!demande) return false
  demande.statut = 'refusee'
  demande.motif_refus = motif
  writeStore(store)
  return true
}

export function findMockDemande(id, user) {
  const store = readStore()
  const all = [...store.arriving, ...store.approved]
  const demande = all.find((d) => d.id_da === Number(id))
  return demande ? assignToUser(demande, user) : null
}

export const MOCK_FOURNISSEURS = {
  1: { nom: 'ALFATRON', adresse: 'Zone industrielle Alger', tel: '021 23 45 67' },
  2: { nom: 'Bureau Plus', adresse: 'Rue des Frères Boudiaf, Alger', tel: '021 56 78 90' },
  3: { nom: 'Électro Plus', adresse: 'Haï El Badr, Alger', tel: '021 22 23 33' },
  4: { nom: 'Mobili Algérie', adresse: 'Chéraga, Alger', tel: '021 44 45 56' },
  5: { nom: 'Clima Tech', adresse: 'Bab Ezzouar, Alger', tel: '021 33 34 44' },
  6: { nom: 'Green Supply', adresse: 'Dely Brahim, Alger', tel: '021 66 67 77' },
  7: { nom: 'Paper & Co', adresse: 'Hussein Dey, Alger', tel: '021 88 89 99' },
}

export function mockRegroupement(user) {
  const approved = getMockApproved(user).filter((d) => !d.has_bc)
  const paniers = {}
  for (const d of approved) {
    const fid = d.fournisseur_id
    if (!fid) continue
    if (!paniers[fid]) {
      const f = MOCK_FOURNISSEURS[fid] || { nom: `Fournisseur ${fid}` }
      paniers[fid] = {
        fournisseur_id: fid,
        fournisseur_nom: f.nom,
        inclus: true,
        ids_da: [],
        produits: {},
      }
    }
    paniers[fid].ids_da.push(d.id_da)
    for (const l of d.lignes) {
      const pid = l.num_ligne_da
      if (paniers[fid].produits[pid]) {
        paniers[fid].produits[pid].quantite += l.qte
      } else {
        paniers[fid].produits[pid] = {
          produit_id: pid,
          nom: l.designation,
          quantite: l.qte,
          prix_unitaire: Number(l.prix_unit),
        }
      }
    }
  }
  return Object.values(paniers).map((p) => ({
    ...p,
    produits: Object.values(p.produits),
  }))
}

export function mockGenererBonsCommande(paniers = []) {
  const store = readStore()

  const idsDa = paniers.flatMap((p) => p.ids_da || [])
  store.approved.forEach((d) => {
    if (d.statut === 'approuvee' && idsDa.includes(d.id_da)) {
      d.has_bc = true
    }
  })

  const bons = store.bons
  let nextId = bons.reduce((m, b) => Math.max(m, b.id_bc), 0) + 1
  let nextLigne = bons.reduce((m, b) => Math.max(m, ...b.lignes.map((l) => l.num_ligne_bc)), 0) + 1

  for (const p of paniers) {
    if (!p.fournisseur_id) continue
    const fournisseur = MOCK_FOURNISSEURS[p.fournisseur_id] || { nom: 'Fournisseur', adresse: '', tel: '' }
    const lignes = p.produits.map((pr) => ({
      num_ligne_bc: nextLigne++,
      produit_nom: pr.nom,
      qte: pr.quantite,
      prix_unitaire: Number(pr.prix_unitaire),
    }))
    const montant = lignes.reduce((s, l) => s + l.prix_unitaire * l.qte, 0)
    bons.push({
      id_bc: nextId,
      reference: `BC-${nextId}`,
      fournisseur_nom: fournisseur.nom,
      fournisseur_adresse: fournisseur.adresse,
      fournisseur_tel: fournisseur.tel,
      acheteur_nom: null,
      date_creation: new Date().toISOString().slice(0, 10),
      montant,
      status: 'en cours',
      lignes,
    })
    nextId += 1
  }

  writeStore(store)
  return bons
}

export function getMockBons() {
  return readStore().bons.map((b) => ({ ...b, lignes: [...b.lignes] }))
}

