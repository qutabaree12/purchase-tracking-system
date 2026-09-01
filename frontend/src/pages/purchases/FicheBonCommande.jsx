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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    api
      .get(`/bons-commande/${id}/`)
      .then((res) => {
        if (active) setBon(res.data)
      })
      .catch(() => {
        if (active) setError('Erreur lors du chargement du bon de commande.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-8 text-gray-500">Chargement...</div>
      </div>
    )
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fiche Bon de Commande</h1>
          <p className="text-sm text-gray-500 mt-1">
            Détail du {bon.reference || `BC-${bon.id_bc}`}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={() => exporterPdfUn(bon)}>
            Exporter PDF
          </button>
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            ← Retour
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Informations
          </span>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500">N° Bon</p>
              <p className="text-sm font-medium mt-1">{bon.reference || `BC-${bon.id_bc}`}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Fournisseur</p>
              <p className="text-sm font-medium mt-1">{bon.fournisseur_nom}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Acheteur</p>
              <p className="text-sm font-medium mt-1">{bon.acheteur_nom}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Date</p>
              <p className="text-sm font-medium mt-1">{formatDate(bon.date_creation)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Statut</p>
              <p className="mt-1"><StatusBadge status={bon.status} /></p>
            </div>
          </div>
          {(bon.fournisseur_adresse || bon.fournisseur_tel) && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {bon.fournisseur_adresse && (
                <div>
                  <p className="text-xs font-semibold text-gray-500">Adresse fournisseur</p>
                  <p className="text-sm font-medium mt-1">{bon.fournisseur_adresse}</p>
                </div>
              )}
              {bon.fournisseur_tel && (
                <div>
                  <p className="text-xs font-semibold text-gray-500">Téléphone fournisseur</p>
                  <p className="text-sm font-medium mt-1">{bon.fournisseur_tel}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Lignes du bon de commande
          </span>
          <span className="text-sm font-semibold text-gray-700">
            Montant total : {formatCurrency(bon.montant)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Produit</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Qté</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Prix unitaire</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bon.lignes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Aucune ligne sur ce bon de commande.
                  </td>
                </tr>
              ) : (
                bon.lignes.map((ligne) => (
                  <tr key={ligne.num_ligne_bc} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">{ligne.produit_nom}</td>
                    <td className="px-4 py-3 text-gray-700">{ligne.qte}</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(ligne.prix_unitaire)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatCurrency(Number(ligne.qte) * Number(ligne.prix_unitaire))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Le formulaire du dossier d'importation (douane, autorisation, transport)
          sera ajouté ici une fois DossierImportation créé côté backend. */}
    </div>
  )
}