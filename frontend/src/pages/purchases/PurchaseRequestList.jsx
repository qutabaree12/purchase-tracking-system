import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import RejectionLetterForm from "../../components/forms/RejectionLetterForm";

import { formatDate } from "../../utils/format";


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

        <button
          onClick={() => navigate("/purchases/request/new")}
          className="btn-primary"
        >
          + Nouvelle demande
        </button>

      </div>

      <DataTable
        columns={columns}
        data={data}
        onEdit={(request) =>
          navigate(`/purchases/request/${request.id_da}`)
        }
        onReject={handleReject}
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
}