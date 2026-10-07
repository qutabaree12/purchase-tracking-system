export const ROLE_ACCESS = {
  admin: {
    home: '/admin',
    nav: [
      { name: 'Tableau de bord', path: '/admin' },
      { name: 'Utilisateurs', path: '/admin/users' },
      { name: "Demandes d'achat", path: '/admin/demandes' },
      { name: 'Bons de commande', path: '/admin/bons-commande' },
      { name: 'Produits', path: '/admin/produits' },
      { name: 'Fournisseurs', path: '/admin/fournisseurs' },
    ],
    paths: ['/admin', '/admin/users', '/admin/demandes', '/admin/bons-commande', '/admin/produits', '/admin/fournisseurs'],
  },
  'chef département': {
    home: '/purchases/requests',
    nav: [
      { name: "Demandes d'achat", path: '/purchases/requests' },
      { name: 'Bons de commande', path: '/purchases/orders' },
  ],
  prefixes: ['/purchases/request', '/purchases/orders', '/purchases/order'],
},
  demandeur: {
    home: '/purchases/requests',
    nav: [{ name: "Demandes d'achat", path: '/purchases/requests' }],
    prefixes: ['/purchases/request'],
  },
  acheteur: {
    home: '/purchases/requests',
    nav: [
      { name: "Demandes d'achat", path: '/purchases/requests' },
      { name: 'Demandes Approuvées', path: '/purchases/approved-requests' },
      { name: 'Regroupement', path: '/purchases/regroupement' },
      { name: 'Bons de commande', path: '/purchases/orders' },
    ],
    prefixes: ['/purchases/regroupement', '/purchases/order', '/purchases/request', '/purchases/approved-requests'],
  },
  transitaire: {
    home: '/purchases/dashboard',
    nav: [
      { name: 'Tableau de bord', path: '/purchases/dashboard' },
      { name: "Dossiers d'importation", path: '/purchases/dossiers' },
      { name: 'Documents de transport', path: '/purchases/documents-transport' },
      { name: 'Assurances', path: '/purchases/assurances' },
      { name: 'Suivi du transport', path: '/purchases/suivi-transport' },
      { name: 'Réception des colis', path: '/purchases/reception' },
      { name: 'Historique', path: '/purchases/historique' },
    ],
    prefixes: ['/purchases/dashboard', '/purchases/dossiers', '/purchases/order', '/purchases/documents-transport', '/purchases/assurances', '/purchases/suivi-transport', '/purchases/reception', '/purchases/historique'],
  },
  directeur: {
    home: '/admin',
    nav: [{ name: 'Tableau de bord', path: '/admin' }],
    paths: ['/admin'],
  },
  controleur: {
    home: '/controleur',
    nav: [
      { name: 'Tableau de bord', path: '/controleur' },
      { name: 'Dossier à vérifier', path: '/controleur/dossiers' },
      { name: 'Dossier vérifié', path: '/controleur/verifies' },
      { name: 'Lettre de crédit', path: '/controleur/lettres' },
    ],
    prefixes: ['/controleur'],
  },
}

export function getRoleAccess(role) {
  return ROLE_ACCESS[role] || { home: '/', nav: [], paths: [], prefixes: [] }
}

/*export function isPathAllowed(role, pathname) {
  const { paths, prefixes } = getRoleAccess(role)
  if (paths && paths.some((p) => pathname === p)) return true
  if (prefixes && prefixes.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + 's'))) return true
  return false
}*/

export function isPathAllowed(role, pathname) {
  if (pathname === '/profile') return true

  const { paths, prefixes } = getRoleAccess(role)

  if (paths && paths.some((p) => pathname === p)) return true

  if (
    prefixes &&
    prefixes.some(
      (p) =>
        pathname === p ||
        pathname.startsWith(p + '/') ||
        pathname.startsWith(p + 's')
    )
  ) {
    return true
  }

  return false
}
