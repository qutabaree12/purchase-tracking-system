/*import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import RejectionLetterForm from "../../components/forms/RejectionLetterForm";

import { formatDate } from "../../utils/format";

import { useAuth } from "../../context/AuthContext"

import { ROLES } from "../../constants/roles"


const mockData = [
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
    statut: 'approuvee',
  },
]

export default function PurchaseRequestList() {
  const navigate = useNavigate();
  const { user } = useAuth()

  const [data] = useState(mockData);

  // ---------- Popup de rejet ----------
  const [openReject, setOpenReject] = useState(false);

  // DA sélectionnée
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // Données du formulaire de rejet
  const [rejectData, setRejectData] = useState({
    motif: "",
  });

  // Erreurs de validation
  const [errors, setErrors] = useState({});

  // ---------- Actions ----------

  const handleReject = (request) => {
    setSelectedRequestId(request.id_da);

    setRejectData({
      motif: "",
    });

    setErrors({});
    setOpenReject(true);
  };

  const handleRejectChange = (e) => {
    setRejectData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleConfirmReject = () => {
    if (!rejectData.motif.trim()) {
      setErrors({
        motif: "Le motif est obligatoire.",
      });
      return;
    }

    


    // Plus tard :
    // INSERT INTO lettre_rejet
    // UPDATE demande_achat SET statut='refusee'

    console.log({
      id_da: selectedRequestId,
      motif: rejectData.motif,
    });

    setOpenReject(false);
  };

  const handleEdit = (request) => {

    navigate(`/purchases/request/${request.id_da}`)
  
  };

  // ---------- Colonnes du tableau ----------

  const columns = [
    {
      key: "numero_da",
      header: "N° DA",
      sortable: true,
    },
    {
      key: "dot",
      header: "DOT",
    },
    {
      key: "demandeur",
      header: "Demandeur",
      sortable: true,
    },
    {
      key: "date_creation",
      header: "Date",
      sortable: true,
      render: (r) => formatDate(r.date_creation),
    },
    {
      key: "objet",
      header: "Objet",
    },
    {
      key: "statut",
      header: "Statut",
      render: (r) => (
        <StatusBadge status={r.statut} />
      ),
    },
  ];

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-semibold">
            Demandes d'achat
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Liste des demandes d'achat enregistrées
          </p>
        </div>
        {

        user?.role===ROLES.DEMANDEUR && (
          <button
            onClick={() => navigate("/purchases/request/new")}
            className="btn-primary"
          >
            + Nouvelle demande
          </button>
        )
        }
      </div>

     

      <DataTable

        columns={columns}

        data={data}

        onEdit={
        user?.role===ROLES.DEMANDEUR
        ?handleEdit
        :null
        }

        onReject={
          user?.role === ROLES.ACHETEUR
          ? handleReject
          : null
        }

      />

      <ConfirmDialog
        open={openReject}
        title="Refuser la demande d'achat"
        confirmLabel="Refuser"
        cancelLabel="Annuler"
        onConfirm={handleConfirmReject}
        onCancel={() => setOpenReject(false)}
      >
        <RejectionLetterForm
          data={rejectData}
          onChange={handleRejectChange}
          errors={errors}
        />
      </ConfirmDialog>

    </div>
  );
}*/

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import RejectionLetterForm from '../../components/forms/RejectionLetterForm'

import { formatDate } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

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

  const [data, setData] = useState(initialData)

  // --------------------------------------------------
  // REJET
  // --------------------------------------------------

  const [openReject, setOpenReject] = useState(false)

  const [selectedRequest, setSelectedRequest] = useState(null)

  const [rejectData, setRejectData] = useState({
    motif: '',
  })

  const [errors, setErrors] = useState({})

  // --------------------------------------------------
  // FILTRAGE SELON LE ROLE
  // --------------------------------------------------

  const displayedData =
    user?.role === ROLES.DEMANDEUR
      ? data.filter(
          (request) => request.demandeur === user?.full_name
        )
      : data

  // --------------------------------------------------
  // CONSULTER UNE DEMANDE
  // --------------------------------------------------

  const handleView = (request) => {
    navigate(`/purchases/request/${request.id_da}`)
  }

  // --------------------------------------------------
  // APPROUVER UNE DEMANDE
  // --------------------------------------------------

  const handleApprove = (request) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id_da === request.id_da
          ? {
              ...item,
              statut: 'approuvee',
            }
          : item
      )
    )

    console.log('Demande approuvée :', request.id_da)
  }

  // --------------------------------------------------
  // OUVRIR LE FORMULAIRE DE REJET
  // --------------------------------------------------

  const handleReject = (request) => {
    setSelectedRequest(request)

    setRejectData({
      motif: '',
    })

    setErrors({})

    setOpenReject(true)
  }

  // --------------------------------------------------
  // MODIFICATION DU MOTIF
  // --------------------------------------------------

  const handleRejectChange = (e) => {
    setRejectData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // --------------------------------------------------
  // CONFIRMER LE REJET
  // --------------------------------------------------

  const handleConfirmReject = () => {
    if (!rejectData.motif.trim()) {
      setErrors({
        motif: 'Le motif du rejet est obligatoire.',
      })

      return
    }

    setData((prevData) =>
      prevData.map((item) =>
        item.id_da === selectedRequest.id_da
          ? {
              ...item,
              statut: 'refusee',
            }
          : item
      )
    )

    console.log('Lettre de rejet :', {
      id_da: selectedRequest.id_da,
      motif: rejectData.motif,
    })

    setOpenReject(false)
    setSelectedRequest(null)
    setRejectData({
      motif: '',
    })
    setErrors({})
  }

  // --------------------------------------------------
  // COLONNES DU TABLEAU
  // --------------------------------------------------

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
      render: (request) => (
        <StatusBadge status={request.statut} />
      ),
    },
  ]

  return (
    <div className="space-y-6">

      {/* ------------------------------------------------
          EN-TETE
      ------------------------------------------------ */}

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-semibold text-brand-navy">
            Demandes d'achat
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            {user?.role === ROLES.DEMANDEUR
              ? 'Consultez vos demandes d’achat.'
              : 'Consultez et traitez les demandes d’achat.'}
          </p>
        </div>

        {/* Bouton uniquement pour le demandeur */}

        {user?.role === ROLES.DEMANDEUR && (
          <button
            onClick={() => navigate('/purchases/request/new')}
            className="btn-primary"
          >
            + Nouvelle demande
          </button>
        )}

      </div>

      {/* ------------------------------------------------
          TABLEAU
      ------------------------------------------------ */}

      <DataTable
        columns={columns}
        data={displayedData}
        onEdit={handleView}
        onApprove={
          user?.role === ROLES.ACHETEUR
            ? handleApprove
            : null
        }
        onReject={
          user?.role === ROLES.ACHETEUR
            ? handleReject
            : null
        }
      />

      {/* ------------------------------------------------
          POPUP DE REJET
      ------------------------------------------------ */}

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
            <p className="text-sm text-gray-500">
              Demande concernée
            </p>

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