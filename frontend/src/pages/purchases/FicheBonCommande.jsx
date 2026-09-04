import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import StatusBadge from '../../components/common/StatusBadge'
import { formatCurrency } from '../../utils/format'
import { exporterPdfUn } from '../../utils/bcPdf'

function formatDate(date) {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('fr-FR')
}

export default function FicheBonCommande() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [bon, setBon] = useState(null)
  const [dossier, setDossier] = useState(null)
  const [transitaires, setTransitaires] = useState([])

  const [transitaireSelectionne, setTransitaireSelectionne] = useState('')

  const [loading, setLoading] = useState(true)
  const [loadingDossier, setLoadingDossier] = useState(true)
  const [assigning, setAssigning] = useState(false)

  const [error, setError] = useState(null)
  const [dossierError, setDossierError] = useState(null)
  const [assignError, setAssignError] = useState(null)
  const [success, setSuccess] = useState(null)

  // ============================================================
  // 1. Charger le BC
  // ============================================================
  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)

    api
      .get(`/bons-commande/${id}/`)
      .then((res) => {
        if (!active) return

        setBon(res.data)
      })
      .catch((err) => {
        console.error('Erreur chargement BC:', err)

        if (active) {
          setError(
            'Erreur lors du chargement du bon de commande.'
          )
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  // ============================================================
  // 2. Charger le dossier d'importation
  // ============================================================
  useEffect(() => {
    let active = true

    setLoadingDossier(true)
    setDossierError(null)
    setDossier(null)

    api
      .get('/dossiers-importation/')
      .then((res) => {
        if (!active) return

        const dossiers = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
            ? res.data.results
            : []

        const dossierTrouve = dossiers.find(
          (item) => Number(item.id_bc) === Number(id)
        )

        if (dossierTrouve) {
          setDossier(dossierTrouve)

          setTransitaireSelectionne(
            dossierTrouve.id_transitaire
              ? String(dossierTrouve.id_transitaire)
              : ''
          )
        } else {
          setDossierError(
            "Aucun dossier d'importation n'a été trouvé pour ce BC."
          )
        }
      })
      .catch((err) => {
        console.error(
          'Erreur chargement dossier importation:',
          err
        )

        if (active) {
          setDossierError(
            "Erreur lors du chargement du dossier d'importation."
          )
        }
      })
      .finally(() => {
        if (active) {
          setLoadingDossier(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  // ============================================================
  // 3. Charger les transitaires actifs
  // ============================================================
  useEffect(() => {
    let active = true

    api
      .get('/users/')
      .then((res) => {
        if (!active) return

        const users = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
            ? res.data.results
            : []

        const actifs = users.filter(
          (user) =>
            user.role === 'transitaire' &&
            user.etat === 'actif'
        )

        setTransitaires(actifs)
      })
      .catch((err) => {
        console.error(
          'Erreur chargement transitaires:',
          err
        )

        if (active) {
          setAssignError(
            'Impossible de charger la liste des transitaires.'
          )
        }
      })

    return () => {
      active = false
    }
  }, [])

  // ============================================================
  // 4. Assigner le transitaire
  // ============================================================
  const assignerTransitaire = async () => {
    if (!dossier) return

    if (!transitaireSelectionne) {
      setAssignError(
        'Veuillez choisir un transitaire.'
      )
      setSuccess(null)
      return
    }

    setAssigning(true)
    setAssignError(null)
    setSuccess(null)

    try {
      const res = await api.post(
        `/dossiers-importation/${dossier.id_dossier}/assigner_transitaire/`,
        {
          transitaire_id: Number(
            transitaireSelectionne
          ),
        }
      )

      setDossier(res.data)

      setTransitaireSelectionne(
        res.data.id_transitaire
          ? String(res.data.id_transitaire)
          : ''
      )

      setSuccess(
        'Le transitaire a été assigné avec succès.'
      )
    } catch (err) {
      console.error(
        'Erreur assignation transitaire:',
        err
      )

      setAssignError(
        err.response?.data?.detail ||
          "Erreur lors de l'assignation du transitaire."
      )
    } finally {
      setAssigning(false)
    }
  }

  // ============================================================
  // Chargement BC
  // ============================================================
  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-8 text-gray-500">
          Chargement...
        </div>
      </div>
    )
  }

  // ============================================================
  // Erreur BC
  // ============================================================
  if (error || !bon) {
    return (
      <div className="card">
        <div className="card-body text-center py-8 text-gray-500">
          {error || 'Bon de commande introuvable.'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Fiche Bon de Commande
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Détail du{' '}
            {bon.reference || `BC-${bon.id_bc}`}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => exporterPdfUn(bon)}
          >
            Exporter PDF
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(-1)}
          >
            ← Retour
          </button>
        </div>
      </div>

      {/* ======================================================
          INFORMATIONS BC
      ====================================================== */}
      <div className="card">
        <div className="card-header">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Informations
          </span>
        </div>

        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

            <div>
              <p className="text-xs font-semibold text-gray-500">
                N° Bon
              </p>

              <p className="text-sm font-medium mt-1">
                {bon.reference || `BC-${bon.id_bc}`}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500">
                Fournisseur
              </p>

              <p className="text-sm font-medium mt-1">
                {bon.fournisseur_nom || '-'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500">
                Acheteur
              </p>

              <p className="text-sm font-medium mt-1">
                {bon.acheteur_nom || '-'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500">
                Date
              </p>

              <p className="text-sm font-medium mt-1">
                {formatDate(bon.date_creation)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500">
                Statut
              </p>

              <p className="mt-1">
                <StatusBadge status={bon.status} />
              </p>
            </div>

          </div>

          {(bon.fournisseur_adresse ||
            bon.fournisseur_tel) && (
            <div className="mt-4 grid grid-cols-2 gap-4">

              {bon.fournisseur_adresse && (
                <div>
                  <p className="text-xs font-semibold text-gray-500">
                    Adresse fournisseur
                  </p>

                  <p className="text-sm font-medium mt-1">
                    {bon.fournisseur_adresse}
                  </p>
                </div>
              )}

              {bon.fournisseur_tel && (
                <div>
                  <p className="text-xs font-semibold text-gray-500">
                    Téléphone fournisseur
                  </p>

                  <p className="text-sm font-medium mt-1">
                    {bon.fournisseur_tel}
                  </p>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          LIGNES BC
      ====================================================== */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Lignes du bon de commande
          </span>

          <span className="text-sm font-semibold text-gray-700">
            Montant total :{' '}
            {formatCurrency(bon.montant)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">

                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Produit
                </th>

                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Qté
                </th>

                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Prix unitaire
                </th>

                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Total
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {!Array.isArray(bon.lignes) ||
              bon.lignes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Aucune ligne sur ce bon de commande.
                  </td>
                </tr>
              ) : (
                bon.lignes.map((ligne) => (
                  <tr
                    key={ligne.num_ligne_bc}
                    className="hover:bg-gray-50 transition-colors"
                  >

                    <td className="px-4 py-3 text-gray-700">
                      {ligne.produit_nom || '-'}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {ligne.qte}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {formatCurrency(
                        ligne.prix_unitaire
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {formatCurrency(
                        Number(ligne.qte || 0) *
                        Number(
                          ligne.prix_unitaire || 0
                        )
                      )}
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          DOSSIER D'IMPORTATION
      ====================================================== */}
      <div className="card">

        <div className="card-header">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Dossier d'importation
          </span>
        </div>

        <div className="card-body">

          {loadingDossier ? (
            <p className="text-sm text-gray-500">
              Chargement du dossier...
            </p>
          ) : dossierError ? (
            <div className="text-sm text-red-600">
              {dossierError}
            </div>
          ) : dossier ? (
            <div className="space-y-6">

              {/* =========================
                  STATUT
              ========================= */}
              <div className="flex items-center gap-3">

                <span className="text-sm font-medium text-gray-600">
                  Statut :
                </span>

                <StatusBadge status={dossier.statut} />

              </div>

              {/* =========================
                  TRANSITAIRE
              ========================= */}
              <div>

                <label
                  htmlFor="transitaire"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Transitaire
                </label>

                <div className="flex gap-3">

                  <select
                    id="transitaire"
                    className="input flex-1"
                    value={transitaireSelectionne}
                    onChange={(e) => {
                      setTransitaireSelectionne(
                        e.target.value
                      )
                      setAssignError(null)
                      setSuccess(null)
                    }}
                    disabled={assigning}
                  >
                    <option value="">
                      Sélectionner un transitaire
                    </option>

                    {transitaires.map(
                      (transitaire) => (
                        <option
                          key={transitaire.id_emp}
                          value={transitaire.id_emp}
                        >
                          {transitaire.full_name ||
                            `${transitaire.prenom || transitaire.prénom || ''} ${transitaire.nom || ''}`.trim() ||
                            `Employé #${transitaire.id_emp}`}
                        </option>
                      )
                    )}
                  </select>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={assignerTransitaire}
                    disabled={
                      assigning ||
                      !transitaireSelectionne
                    }
                  >
                    {assigning
                      ? 'Assignation...'
                      : dossier.id_transitaire
                        ? 'Réassigner'
                        : 'Assigner'}
                  </button>

                </div>

                {dossier.id_transitaire && (
                  <p className="text-xs text-gray-500 mt-2">
                    Un transitaire est actuellement
                    assigné à ce dossier.
                  </p>
                )}

              </div>

              {/* =========================
                  INFORMATIONS IMPORTATION
              ========================= */}
              <div className="border-t border-gray-200 pt-5">

                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Informations d'importation
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      Mode d'expédition
                    </p>

                    <p className="text-sm font-medium mt-1">
                      {dossier.mode_expedition || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      Lieu de chargement
                    </p>

                    <p className="text-sm font-medium mt-1">
                      {dossier.lieu_chargement || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      Tarif douane
                    </p>

                    <p className="text-sm font-medium mt-1">
                      {dossier.tarif_douane || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      Autorisation nécessaire
                    </p>

                    <p className="text-sm font-medium mt-1">
                      {dossier.autorisation_necessaire
                        ? 'Oui'
                        : 'Non'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      Autorisation obtenue
                    </p>

                    <p className="text-sm font-medium mt-1">
                      {dossier.autorisation_obtenue
                        ? 'Oui'
                        : 'Non'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      N° autorisation
                    </p>

                    <p className="text-sm font-medium mt-1">
                      {dossier.numero_autorisation || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      Livraison prévue
                    </p>

                    <p className="text-sm font-medium mt-1">
                      {formatDate(
                        dossier.date_livraison_prevue
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      Réception réelle
                    </p>

                    <p className="text-sm font-medium mt-1">
                      {formatDate(
                        dossier.date_reception_reelle
                      )}
                    </p>
                  </div>

                </div>

              </div>

              {/* =========================
                  MESSAGES
              ========================= */}
              {assignError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {assignError}
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
                  {success}
                </div>
              )}

            </div>
          ) : null}

        </div>
      </div>

    </div>
  )
}