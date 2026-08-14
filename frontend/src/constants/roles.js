export const ROLE_ACCESS = {
  admin: {
    home: '/admin',
    nav: [
      { name: 'Tableau de bord', path: '/admin' },
      { name: 'Utilisateurs', path: '/admin/users' },
    ],
    paths: ['/admin', '/admin/users'],
  },
  'chef département': {
    home: '/purchases/requests',
    nav: [{ name: "Demandes d'achat", path: '/purchases/requests' }],
    prefixes: ['/purchases/request'],
  },
  demandeur: {
    home: '/purchases/requests',
    nav: [{ name: "Demandes d'achat", path: '/purchases/requests' }],
    prefixes: ['/purchases/request'],
  },
  acheteur: {
    home: '/purchases/regroupement',
    nav: [
      { name: "Demandes d'achat", path: '/purchases/requests' },
      { name: 'Demandes Approuvées', path: '/purchases/approved-requests' },
      { name: 'Regroupement', path: '/purchases/regroupement' },
      { name: 'Bons de commande', path: '/purchases/orders' },
    ],
    prefixes: ['/purchases/regroupement', '/purchases/order', '/purchases/request', '/purchases/approved-requests'],
  },
  transitaire: {
    home: '/purchases/orders',
    nav: [{ name: 'Bons de commande', path: '/purchases/orders' }],
    prefixes: ['/purchases/order'],
  },
  directeur: {
    home: '/admin',
    nav: [{ name: 'Tableau de bord', path: '/admin' }],
    paths: ['/admin'],
  },
}

export function getRoleAccess(role) {
  return ROLE_ACCESS[role] || { home: '/', nav: [], paths: [], prefixes: [] }
}

export function isPathAllowed(role, pathname) {
  const { paths, prefixes } = getRoleAccess(role)
  if (paths && paths.some((p) => pathname === p)) return true
  if (prefixes && prefixes.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + 's'))) return true
  return false
}
