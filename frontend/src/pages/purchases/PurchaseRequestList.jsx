import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

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
  const { user } = useAuth();

  const role = user?.role;
  const isAcheteur = role === 'acheteur';
  const isDemandeur = role === 'demandeur';
  const isChef = role === 'chef département';
  const canCreate = !['acheteur', 'chef département'].includes(role);

  const [data] = useState(mockData);

  // ---------- Popup de rejet (acheteur) ----------
  const [openReject, setOpenReject] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectData, setRejectData] = useState({ motif: "" });
  const [errors, setErrors] = useState({});

  // ---------- Popup "Choisir un acheteur" (chef département) ----------
  const [openAssign, setOpenAssign] = useState(false);
  const [acheteurs, setAcheteurs] = useState([]);
  const [selectedAcheteur, setSelectedAcheteur] = useState('');
  const [assignError, setAssignError] = useState('');

  // ---------- Actions ----------

  const handleReject = (request) => {
    setSelectedRequestId(request.id_da);
    setRejectData({ motif: "" });
    setErrors({});
    setOpenReject(true);
  };

  const handleRejectChange = (e) => {
    setRejectData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleConfirmReject = () => {
    if (!rejectData.motif.trim()) {
      setErrors({ motif: "Le motif est obligatoire." });
      return;
    }
    console.log({ id_da: selectedRequestId, motif: rejectData.motif });
    setOpenReject(false);
  };

  const handleAssign = async (request) => {
    setSelectedRequestId(request.id_da);
    setSelectedAcheteur('');
    setAssignError('');
    try {
      const res = await api.get('/users/')
      const list = res.data.filter((u) => u.role === 'acheteur')
      setAcheteurs(list)
    } catch {
      setAcheteurs([])
    }
    setOpenAssign(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedAcheteur) {
      setAssignError("Veuillez choisir un acheteur.");
      return;
    }
    try {
      await api.post(`/demandes/${selectedRequestId}/assigner_acheteur/`, {
        acheteur_id: Number(selectedAcheteur),
      })
      setOpenAssign(false)
    } catch (err) {
      setAssignError(err.response?.data?.detail || "Erreur lors de l'assignation.")
    }
  };

  // ---------- Colonnes du tableau ----------

  const columns = [
    { key: "numero_da", header: "N° DA", sortable: true },
    { key: "dot", header: "DOT" },
    { key: "demandeur", header: "Demandeur", sortable: true },
    { key: "date_creation", header: "Date", sortable: true, render: (r) => formatDate(r.date_creation) },
    { key: "objet", header: "Objet" },
    { key: "statut", header: "Statut", render: (r) => <StatusBadge status={r.statut} /> },
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

        {canCreate && (
          <button
            onClick={() => navigate("/purchases/request/new")}
            className="btn-primary"
          >
            + Nouvelle demande
          </button>
        )}

      </div>

      <DataTable
        columns={columns}
        data={data}
        onEdit={isDemandeur ? (request) => navigate(`/purchases/request/${request.id_da}`) : undefined}
        onReject={isAcheteur ? handleReject : undefined}
        onAssign={isChef ? handleAssign : undefined}
      />

      {/* Rejet (acheteur) */}
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

      {/* Assignation acheteur (chef département) */}
      <ConfirmDialog
        open={openAssign}
        title="Choisir un acheteur"
        confirmLabel="Assigner"
        cancelLabel="Annuler"
        onConfirm={handleConfirmAssign}
        onCancel={() => setOpenAssign(false)}
      >
        <div className="space-y-3">
          <label className="label">Acheteur</label>
          <select
            className="input"
            value={selectedAcheteur}
            onChange={(e) => setSelectedAcheteur(e.target.value)}
          >
            <option value="">Sélectionner un acheteur...</option>
            {acheteurs.map((a) => (
              <option key={a.id_emp} value={a.id_emp}>{a.full_name}</option>
            ))}
          </select>
          {assignError && <p className="text-sm text-red-600">{assignError}</p>}
        </div>
      </ConfirmDialog>

    </div>
  );
}
