import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'
import { formatDate, modeExpeditionLabel } from '../../utils/format'

const JOUR = 86400000

function ecartJours(d) {
  if (!d.date_livraison_prevue || !d.date_reception_reelle) return null
  return Math.round((new Date(d.date_reception_reelle) - new Date(d.date_livraison_prevue)) / JOUR)
}

function Ecart({ dossier }) {
  const jours = ecartJours(dossier)
  if (jours === null) return <span className="text-gray-400">—</span>
  if (jours === 0) return <span className="text-emerald-600">À la date prévue</span>
  if (jours < 0) return <span className="text-emerald-600">{-jours} j d'avance</span>
  return <span className="text-rose-600">{jours} j de retard</span>
}

export default function Historique() {
  const navigate = useNavigate()
  const [dossiers, setDossiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    api
      .get('/dossiers-importation/')
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : res.data.results || []
        if (active) setDossiers(items.filter((d) => d.statut === 'livré'))
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.detail || "Erreur lors du chargement de l'historique.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const q = search.trim().toLowerCase()
  const visibles = useMemo(
    () =>
      dossiers
        .filter(
          (d) =>
            !q ||
            `${d.bc_reference || ''} ${d.fournisseur_nom || ''} ${d.da_reference || ''}`
              .toLowerCase()
              .includes(q)
        )
        .sort((a, b) => String(b.date_reception_reelle || '').localeCompare(String(a.date_reception_reelle || ''))),
    [dossiers, q]
  )

  const avecEcart = visibles.map(ecartJours).filter((j) => j !== null)
  const retards = avecEcart.filter((j) => j > 0).length

  const columns = [
    { key: 'bc_reference', header: 'N° BC', sortable: true, render: (d) => d.bc_reference || `BC-${d.id_bc}` },
    { key: 'fournisseur_nom', header: 'Fournisseur', sortable: true, render: (d) => d.fournisseur_nom || '-' },
    { key: 'da_reference', header: 'DA liées', render: (d) => d.da_reference || '-' },
    { key: 'mode_expedition', header: 'Mode', render: (d) => modeExpeditionLabel(d.mode_expedition) },
    {
      key: 'date_livraison_prevue',
      header: 'Livraison prévue',
      sortable: true,
      render: (d) => (d.date_livraison_prevue ? formatDate(d.date_livraison_prevue) : '-'),
    },
    {
      key: 'date_reception_reelle',
      header: 'Reçue le',
      sortable: true,
      render: (d) => (d.date_reception_reelle ? formatDate(d.date_reception_reelle) : '-'),
    },
    { key: 'ecart', header: 'Écart', render: (d) => <Ecart dossier={d} /> },
    { key: 'numero_lc', header: 'Lettre de crédit', render: (d) => d.numero_lc || '-' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {loading
            ? 'Chargement...'
            : `${visibles.length} dossier${visibles.length > 1 ? 's' : ''} livré${visibles.length > 1 ? 's' : ''}` +
              (avecEcart.length ? ` · ${retards} livré${retards > 1 ? 's' : ''} en retard` : '')}
        </p>
        <input
          type="text"
          className="input"
          style={{ maxWidth: 280 }}
          placeholder="Rechercher un BC, fournisseur, DA…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={visibles}
        loading={loading}
        onView={(d) => navigate(`/purchases/order/${d.id_bc}/fiche`)}
        actionsLabel="Fiche"
        emptyMessage="Aucun dossier livré pour le moment."
      />
    </div>
  )
}
