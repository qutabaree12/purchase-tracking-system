import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { exporterPdfUn, exporterPdfTous } from '../../utils/bcPdf'

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR')
}

export default function PurchaseOrderList() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  const applyData = (res) => {
    const items = Array.isArray(res.data) ? res.data : res.data.results || []
    const count = Array.isArray(res.data) ? items.length : res.data.count ?? items.length
    setData(items)
    setTotal(count)
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/bons-commande/', {
          params: { page: 1, page_size: pageSize },
        })
        if (active) applyData(res)
      } catch (err) {
        if (active) {
          setError(err.response?.data?.detail || 'Erreur lors du chargement des bons de commande.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [pageSize])

  const handlePageChange = (p) => {
    setPage(p)
    setLoading(true)
    setError(null)
    api.get('/bons-commande/', { params: { page: p, page_size: pageSize } })
      .then((res) => applyData(res))
      .catch((err) => {
        setError(err.response?.data?.detail || 'Erreur lors du chargement des bons de commande.')
      })
      .finally(() => setLoading(false))
  }

  const handleView = (bon) => {
    navigate(`/purchases/order/${bon.id_bc}/fiche`)
  }

  const handleExportUn = async (bon) => {
    setExporting(true)
    setError(null)
    try {
      await exporterPdfUn(bon)
    } catch (err) {
      console.error('Erreur export PDF', err)
      setError("Erreur lors de la génération du PDF.")
    } finally {
      setExporting(false)
    }
  }

  const handleExportTous = async () => {
    setExporting(true)
    setError(null)
    try {
      const res = await api.get('/bons-commande/', {
        params: { page_size: 200 },
      })
      const tous = Array.isArray(res.data) ? res.data : res.data.results || []
      await exporterPdfTous(tous)
    } catch (err) {
      console.error('Erreur export PDF', err)
      setError('Erreur lors de la génération des PDF.')
    } finally {
      setExporting(false)
    }
  }

  const columns = [
    { key: 'id_bc', header: 'N° Bon', sortable: true },
    { key: 'fournisseur_nom', header: 'Fournisseur', sortable: true },
    { key: 'date_creation', header: 'Date', sortable: true, render: (o) => formatDate(o.date_creation) },
    { key: 'montant', header: 'Montant', render: (o) => `${Number(o.montant || 0).toLocaleString('fr-FR')} DZD` },
    { key: 'status', header: 'Statut', render: (o) => <StatusBadge status={o.status} /> },
  ]

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleExportTous}
          disabled={data.length === 0 || exporting}
          className="btn-primary"
          title="Générer un PDF par bon de commande à partir du modèle"
        >
          {exporting ? 'Génération...' : 'Exporter tous les PDF'}
        </button>
      </div>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onView={handleView}
        onPdf={handleExportUn}
        actionsLabel="Actions"
      />
    </div>
  )
}
