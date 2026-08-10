import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLayout } from '../../context/LayoutContext'
import { ROLES } from '../../constants/roles'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import RejectionLetterForm from '../../components/forms/RejectionLetterForm'
import { formatDate } from '../../utils/format'

const initialData = [
  {
    id_da: 1,
    numero_da: 'DA-ALG-2026-001',
    dot: 'Alger-Centre',
    demandeur: 'Sara Meziane',
    date_creation: '2026-07-20',
    objet: 'Renouvellement matériel réseau',
    statut: 'en_cours',
  },
  {
    id_da: 2,
    numero_da: 'DA-ALG-2026-002',
    dot: 'Oran',
    demandeur: 'Yacine Haddad',
    date_creation: '2026-07-22',
    objet: 'Connecteurs réseau',
    statut: 'en_cours',
  },
]

export default function PurchaseRequestList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setTitle, setSubtitle, setActions } = useLayout()

  const [data, setData] = useState(initialData)

  // ===== SETUP LAYOUT =====
  useEffect(() => {
    if (user?.role === ROLES.DEMANDEUR) {
      setTitle('Demandes d\'achat')
      setSubtitle('Consultez vos demandes d\'achat.')
    } else {
      setTitle('Demandes d\'achat')
      setSubtitle('Consultez et traitez les demandes d\'achat.')
    }
    setActions(null)

    // Cleanup
    return () => {
      setTitle('')
      setSubtitle('')
      setActions(null)
    }
  }, [user?.role, setTitle, setSubtitle, setActions])

  // ===== REJET =====
  const [openReject, setOpenReject] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [rejectData, setRejectData] = useState({ motif: '' })
  const [errors, setErrors] = useState({})

  // ===== FILTRAGE SELON LE ROLE =====
  const displayedData =
    user?.role === ROLES.DEMANDEUR
      ? data.filter((request) => request.demandeur === user?.full_name)
      : data

  // ===== ACTIONS =====
  const handleView = (request) => {
    navigate(`/purchases/request/${request.id_da}`)
  }

  const handleApprove = (request) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id_da === request.id_da
          ? { ...item, statut: 'approuvee' }
          : item
      )
    )
    console.log('Demande approuvée :', request.id_da)
  }

  const handleReject = (request) => {
    setSelectedRequest(request)
    setRejectData({ motif: '' })
    setErrors({})
    setOpenReject(true)
  }

  const handleRejectChange = (e) => {
    setRejectData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleConfirmReject = () => {
    if (!rejectData.motif.trim()) {
      setErrors({ motif: 'Le motif du rejet est obligatoire.' })
      return
    }

    setData((prevData) =>
      prevData.map((item) =>
        item.id_da === selectedRequest.id_da
          ? { ...item, statut: 'refusee' }
          : item
      )
    )

    console.log('Lettre de rejet :', {
      id_da: selectedRequest.id_da,
      motif: rejectData.motif,
    })

    setOpenReject(false)
    setSelectedRequest(null)
    setRejectData({ motif: '' })
    setErrors({})
  }

  // ===== COLONNES =====
  const columns = [
    {
      key: 'numero_da',
      header: 'N° DA',
      sortable: true,
    },
    {
      key: 'dot',
      header: 'DOT',
    },
    {
      key: 'demandeur',
      header: 'Demandeur',
      sortable: true,
    },
    {
      key: 'date_creation',
      header: 'Date',
      sortable: true,
      render: (request) => formatDate(request.date_creation),
    },
    {
      key: 'objet',
      header: 'Objet',
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (request) => <StatusBadge status={request.statut} />,
    },
  ]

  // ===== RENDER =====
  return (
    <div className="space-y-6">
      {/* BOUTON NOUVELLE DEMANDE - uniquement DEMANDEUR */}
      {user?.role === ROLES.DEMANDEUR && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/purchases/request/new')}
            className="btn-primary"
          >
            + Nouvelle demande
          </button>
        </div>
      )}

      {/* TABLEAU */}
      <DataTable
        columns={columns}
        data={displayedData}
        onEdit={handleView}
        onApprove={
          user?.role === ROLES.ACHETEUR ? handleApprove : null
        }
        onReject={
          user?.role === ROLES.ACHETEUR ? handleReject : null
        }
      />

      {/* POPUP REJET */}
      <ConfirmDialog
        open={openReject}
        title="Refuser la demande d'achat"
        confirmLabel="Refuser"
        cancelLabel="Annuler"
        onConfirm={handleConfirmReject}
        onCancel={() => {
          setOpenReject(false)
          setErrors({})
        }}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Demande concernée</p>
            <p className="font-medium text-gray-900 mt-1">
              {selectedRequest?.numero_da}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {selectedRequest?.objet}
            </p>
          </div>

          <RejectionLetterForm
            data={rejectData}
            onChange={handleRejectChange}
            errors={errors}
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}
