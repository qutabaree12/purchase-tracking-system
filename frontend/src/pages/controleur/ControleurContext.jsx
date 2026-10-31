
import { createContext, useContext, useEffect, useState } from 'react'
import api from '../../services/api'

const ControleurContext = createContext(null)

export function ControleurProvider({ children }) {
  const [dossiers, setDossiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Charger les vrais dossiers depuis Django
  const chargerDossiers = async () => {
    setError('')

    try {
      const response = await api.get('/dossiers-importation/')
      const data = response.data

      // Compatible avec une réponse paginée ou une liste simple
      const liste = Array.isArray(data) ? data : data.results || []

      setDossiers(
        liste.map((d) => ({
          ...d,
          bc: d.bc_reference || `BC #${d.id_bc}`,
          fournisseur: d.fournisseur_nom || '—',
          da: d.da_reference || '—',
          montant: d.montant != null ? `${Number(d.montant).toLocaleString('fr-FR')} DZD` : '—',
          tarif: d.tarif_douane ?? '—',
          auto: d.autorisation_necessaire
            ? d.autorisation_obtenue
              ? 'Nécessaire — obtenue'
              : 'Nécessaire — en attente'
            : 'Aucune',
          autoState: d.autorisation_necessaire ? 'blue' : 'gray',
          mode: d.mode_expedition || '—',
          lieu: d.lieu_chargement || '—',
          statut_controle: d.statut_controle || 'a_verifier',
        }))
      )
    } catch (err) {
      console.error('Erreur chargement dossiers contrôleur :', err)
      setError(
        err.response?.data?.detail ||
        'Impossible de charger les dossiers. Vérifie la connexion à l’API.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerDossiers()
  }, [])

  // Enregistrer la décision dans la base via Django
  const verifier = async (idDossier, donnees) => {
    setSaving(true)
    setError('')

    try {
      await api.post(
        `/dossiers-importation/${idDossier}/verifier_controleur/`,
        donnees
      )

      // Relire les données sauvegardées en base
      await chargerDossiers()
      return true
    } catch (err) {
      const data = err.response?.data
      const message =
        data?.detail ||
        (typeof data === 'object'
          ? Object.values(data).flat().join(' ')
          : null) ||
        'La vérification a échoué.'

      setError(message)
      throw new Error(message)
    } finally {
      setSaving(false)
    }
  }

  const dossiersAVerifier = dossiers.filter(
    (d) => d.statut_controle === 'a_verifier'
  )

  const dossiersVerifies = dossiers.filter(
    (d) => d.statut_controle === 'valide'
  )

  const lettres = dossiersVerifies.filter((d) => d.numero_lc)

  return (
    <ControleurContext.Provider
      value={{
        dossiers,
        lettres,
        dossiersAVerifier,
        dossiersVerifies,
        loading,
        error,
        saving,
        verifier,
        recharger: chargerDossiers,
      }}
    >
      {children}
    </ControleurContext.Provider>
  )
}

export function useControleur() {
  const ctx = useContext(ControleurContext)

  if (!ctx) {
    throw new Error(
      'useControleur must be used within ControleurProvider'
    )
  }

  return ctx
}
