export const ROLE_ACCESS = {
  admin: {
    home: '/admin',
    nav: [
      { name: 'Tableau de bord', path: '/admin' },
      { name: 'Utilisateurs', path: '/admin/users' },
    ],
    prefixes: ['/admin'],
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
      { name: 'Regroupement', path: '/purchases/regroupement' },
      { name: 'Bons de commande', path: '/purchases/orders' },
    ],
    prefixes: ['/purchases/regroupement', '/purchases/order'],
  },
  transitaire: {
    home: '/purchases/orders',
    nav: [{ name: 'Bons de commande', path: '/purchases/orders' }],
    prefixes: ['/purchases/order'],
  },
  directeur: {
    home: '/admin',
    nav: [{ name: 'Tableau de bord', path: '/admin' }],
    prefixes: ['/admin'],
  },
}

export function getRoleAccess(role) {
  return ROLE_ACCESS[role] || { home: '/', nav: [], prefixes: [] }
}

export function isPathAllowed(role, pathname) {
  const { prefixes } = getRoleAccess(role)
  if (prefixes.length === 0) return false
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))
}
