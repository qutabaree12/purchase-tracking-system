import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import { etatDossier } from '../utils/etatDossier'

const liste = (res) => (Array.isArray(res.data) ? res.data : res.data.results || [])

// Nombre d'éléments qui attendent une action, par rôle, indexé par chemin de menu.
async function compter(role) {
  if (role === 'controleur') {
    const d = liste(await api.get('/dossiers-importation/'))
    return { '/controleur/dossiers': d.filter((x) => x.statut_controle === 'a_verifier').length }
  }
  if (role === 'transitaire') {
    const d = liste(await api.get('/dossiers-importation/'))
    const aFaire = d.filter((x) => ['non_commence', 'remplissage', 'refuse'].includes(etatDossier(x))).length
    return { '/purchases/dossiers': aFaire }
  }
  if (role === 'acheteur') {
    const [demandes, bons] = await Promise.all([api.get('/demandes/'), api.get('/bons-commande/')])
    const das = liste(demandes)
    const bcs = liste(bons)
    return {
      '/purchases/requests': das.filter((x) => x.statut === 'en_cours').length,
      '/purchases/approved-requests': das.filter((x) => x.statut === 'approuvee' && x.reste_a_commander).length,
      '/purchases/orders': bcs.filter((b) => (b.id_transitaire ?? null) === null).length,
    }
  }
  if (role === 'chef département') {
    const das = liste(await api.get('/demandes/'))
    return { '/purchases/requests': das.filter((x) => x.statut === 'en_cours' && !x.id_acheteur).length }
  }
  return {}
}

export default function useNavBadges(role) {
  const location = useLocation()
  const [badges, setBadges] = useState({})

  const rafraichir = useCallback(async () => {
    try {
      setBadges(await compter(role))
    } catch {
      // Les compteurs sont un confort : une erreur ne doit jamais gêner la navigation.
    }
  }, [role])

  useEffect(() => {
    if (role) rafraichir()
  }, [role, location.pathname, rafraichir])

  useEffect(() => {
    window.addEventListener('notifications:refresh', rafraichir)
    const minuteur = setInterval(rafraichir, 60000)
    return () => {
      window.removeEventListener('notifications:refresh', rafraichir)
      clearInterval(minuteur)
    }
  }, [rafraichir])

  return badges
}
