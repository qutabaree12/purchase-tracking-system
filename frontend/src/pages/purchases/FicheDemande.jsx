import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Stepper from '../../components/common/Stepper'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import RejectionLetterForm from '../../components/forms/RejectionLetterForm'
import { useAuth } from '../../context/AuthContext'
import { formatDate, formatCurrency } from '../../utils/format'
import { findMockDemande, mockApprouver, mockRejeter } from '../../constants/mockDemandes'

export default function FicheDemande() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [demande, setDemande] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [approving, setApproving] = useState(false)

  const [openReject, setOpenReject] = useState(false)
  const [rejectData, setRejectData] = useState({ motif: '' })
  const [rejectErrors, setRejectErrors] = useState({})
  const [rejectLoading, setRejectLoading] = useState(false)

  const [openMotif, setOpenMotif] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    api
      .get(`/demandes/${id}/`)
      .then((res) => {
        if (active) setDemande(res.data)
      })
      .catch(() => {
        const mock = findMockDemande(id, user)
        if (active) {
          if (mock) setDemande({ ...mock, isMock: true })
          else setError('Erreur lors du chargement de la demande.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, user])

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-8 text-gray-500">Chargement...</div>
      </div>
    )
  }

  if (error || !demande) {
    return (
      <div className="card">
        <div className="card-body text-center py-8 text-gray-500">
          {error || 'Demande introuvable.'}
        </div>
      </div>
    )
  }

  const total = demande.lignes.reduce(
    (sum, ligne) => sum + Number(ligne.qte) * Number(ligne.prix_unit),
    0
  )

  const isAcheteur = user?.role === 'acheteur'
  const isRefused = demande.statut === 'refusee'
  const canApprove = isAcheteur && demande.statut === 'en_cours'

  const handleApprouver = async () => {
    setApproving(true)
    setActionError(null)
    try {
      if (demande.isMock) {
        mockApprouver(demande.id_da, user)
        const updated = findMockDemande(demande.id_da, user)
        setDemande(updated ? { ...updated, isMock: true } : { ...demande, statut: 'approuvee' })
        return
      }
      await api.post(`/demandes/${demande.id_da}/accepter/`)
      const res = await api.get(`/demandes/${demande.id_da}/`)
      setDemande(res.data)
    } catch (err) {
      setActionError(err.response?.data?.detail || "Erreur lors de l'approbation.")
    } finally {
      setApproving(false)
    }
  }

  const handleRejectChange = (e) => {
    setRejectData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRejeter = async () => {
    if (!rejectData.motif.trim()) {
      setRejectErrors({ motif: 'Le motif est obligatoire.' })
      return
    }
    setRejectErrors({})
    setActionError(null)
    setRejectLoading(true)
    try {
      if (demande.isMock) {
        mockRejeter(demande.id_da, rejectData.motif)
        const updated = findMockDemande(demande.id_da, user)
        setDemande(
          updated
            ? { ...updated, isMock: true }
            : { ...demande, statut: 'refusee', motif_refus: rejectData.motif }
        )
        setOpenReject(false)
        return
      }
      await api.post(`/demandes/${demande.id_da}/rejeter/`, { motif: rejectData.motif })
      const res = await api.get(`/demandes/${demande.id_da}/`)
      setDemande(res.data)
      setOpenReject(false)
    } catch (err) {
      setActionError(err.response?.data?.detail || "Erreur lors du refus.")
    } finally {
      setRejectLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fiche Demande d'Achat</h1>
          <p className="text-sm text-gray-500 mt-1">
            Suivi de l'avancement et détail de la demande {demande.numero_da}
          </p>
        </div>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          ← Retour
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Avancement
          </span>
        </div>
        <div className="card-body">
          <Stepper demande={demande} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Informations
          </span>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500">N° DA</p>
              <p className="text-sm font-medium mt-1">{demande.numero_da}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">DOT</p>
              <p className="text-sm font-medium mt-1">{demande.dot || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Demandeur</p>
              <p className="text-sm font-medium mt-1">{demande.demandeur_nom}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Acheteur</p>
              <p className="text-sm font-medium mt-1">{demande.acheteur_nom || 'Non assigné'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Date</p>
              <p className="text-sm font-medium mt-1">{formatDate(demande.date_creation)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Statut</p>
              <p className="mt-1"><StatusBadge status={demande.statut} /></p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500">Objet</p>
            <p className="text-sm font-medium mt-1">{demande.objet}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Lignes de la demande
          </span>
          <span className="text-sm font-semibold text-gray-700">
            Total : {formatCurrency(total)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Désignation</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Produit</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Qté</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Prix unitaire</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {demande.lignes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Aucune ligne sur cette demande.
                  </td>
                </tr>
              ) : (
                demande.lignes.map((ligne) => (
                  <tr key={ligne.num_ligne_da} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">{ligne.designation}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {ligne.produit_detail?.nom_produit || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{ligne.qte}</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(ligne.prix_unit)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatCurrency(Number(ligne.qte) * Number(ligne.prix_unit))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(canApprove || isRefused) && (
        <div className="flex justify-end items-center gap-4">
          {actionError && <p className="text-sm text-red-600">{actionError}</p>}
          {canApprove && (
            <>
              <button onClick={handleApprouver} disabled={approving} className="btn-primary">
                {approving ? 'Approbation...' : 'Approuver'}
              </button>
              <button onClick={() => setOpenReject(true)} className="btn-danger">
                Refuser
              </button>
            </>
          )}
          {isRefused && (
            <button onClick={() => setOpenMotif(true)} className="btn-secondary">
              Voir le motif
            </button>
          )}
        </div>
      )}

      {/* Dialog de refus */}
      <ConfirmDialog
        open={openReject}
        title="Refuser la demande d'achat"
        confirmLabel="Refuser"
        cancelLabel="Annuler"
        loading={rejectLoading}
        onConfirm={handleRejeter}
        onCancel={() => setOpenReject(false)}
      >
        <RejectionLetterForm
          data={rejectData}
          onChange={handleRejectChange}
          errors={rejectErrors}
        />
      </ConfirmDialog>

      {/* Dialog motif de refus */}
      <ConfirmDialog
        open={openMotif}
        title="Motif de refus"
        confirmLabel="Fermer"
        hideCancel
        onConfirm={() => setOpenMotif(false)}
      >
        <p className="text-sm text-gray-700">
          {demande.motif_refus || 'Aucun motif renseigné.'}
        </p>
      </ConfirmDialog>
    </div>
  )
}
