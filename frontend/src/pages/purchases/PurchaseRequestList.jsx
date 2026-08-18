import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";

import { formatDate } from "../../utils/format";
import { getMockArriving, getMockApproved } from "../../constants/mockDemandes";


export default function PurchaseRequestList() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.role;
  const isAcheteur = role === 'acheteur';
  const isDemandeur = role === 'demandeur';
  const isChef = role === 'chef département';
  const canCreate = !['acheteur', 'chef département'].includes(role);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ arrivees: 0, approuvees: 0, bonsCommande: 0 });

  // NOUVEAU : stats propres au demandeur (total / en cours / approuvées / refusées)
  const [demandeurStats, setDemandeurStats] = useState({ total: 0, enCours: 0, approuvees: 0, refusees: 0 });
  // ---------- Popup "Choisir un acheteur" (chef département) ----------
  const [openAssign, setOpenAssign] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [acheteurs, setAcheteurs] = useState([]);
  const [selectedAcheteur, setSelectedAcheteur] = useState('');
  const [assignError, setAssignError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      let usingMock = false;

      try {
        const demandesRes = await api.get('/demandes/');
        if (!active) return;

        if (demandesRes.data.length === 0) {
          usingMock = true;
        } else {
          const nonApprouvees = demandesRes.data.filter((d) => d.statut !== 'approuvee');
          setData(nonApprouvees);

          if (isAcheteur) {
            const [approuveesRes, bonsRes] = await Promise.all([
              api.get('/demandes/?statut=approuvee'),
              api.get('/bons-commande/'),
            ]);
            if (!active) return;
            setStats({
              arrivees: nonApprouvees.length,
              approuvees: approuveesRes.data.length,
              bonsCommande: bonsRes.data.length,
            });
          }

          // NOUVEAU : calcule les stats du demandeur à partir de TOUTES ses DA
          // (pas juste nonApprouvees, donc on refait un appel complet filtré côté client)
          if (isDemandeur) {
            const toutesRes = await api.get('/demandes/');
            if (!active) return;
            const mesDemandes = toutesRes.data; // le backend filtre déjà par id_demandeur (voir get_queryset)
            setDemandeurStats({
              total: mesDemandes.length,
              enCours: mesDemandes.filter((d) => d.statut === 'en_cours').length,
              approuvees: mesDemandes.filter((d) => d.statut === 'approuvee').length,
              refusees: mesDemandes.filter((d) => d.statut === 'refusee').length,
            });
          }
        }
      } catch {
        if (!active) return;
        usingMock = true;
      }

      if (active && usingMock) {
        const liste = getMockArriving(user);
        setData(liste);
        if (isAcheteur) {
          setStats({
            arrivees: liste.length,
            approuvees: getMockApproved(user).length,
            bonsCommande: getMockApproved(user).filter((d) => d.has_bc).length,
          });
        }
        // NOUVEAU : stats demandeur en mode mock
        if (isDemandeur) {
          const approuveesMock = getMockApproved(user);
          setDemandeurStats({
            total: liste.length + approuveesMock.length,
            enCours: liste.filter((d) => d.statut === 'en_cours').length,
            approuvees: approuveesMock.length,
            refusees: liste.filter((d) => d.statut === 'refusee').length,
          });
        }
      }

      if (active) setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [isAcheteur, isDemandeur, user]);  // isDemandeur ajouté aux dépendances

  // ---------- Actions ----------

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

  const handleViewFiche = (request) => {
    navigate(`/purchases/request/${request.id_da}/fiche`);
  };


  const handleDelete = async (request) => {
    if (!window.confirm(`Supprimer la demande ${request.numero_da} ?`)) return;
    try {
      await api.delete(`/demandes/${request.id_da}/`);
      setData((prev) => prev.filter((d) => d.id_da !== request.id_da));  // retire de la liste affichée
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  // ---------- Colonnes du tableau ----------

  const columns = [
    { key: "numero_da", header: "N° DA", sortable: true },
    { key: "dot", header: "DOT" },
    { key: "demandeur_nom", header: "Demandeur", sortable: true },
    { key: "acheteur_nom", header: "Acheteur" },
    { key: "date_creation", header: "Date", sortable: true, render: (r) => formatDate(r.date_creation) },
    { key: "objet", header: "Objet" },
    { key: "statut", header: "Statut", render: (r) => <StatusBadge status={r.statut} /> },
  ];

  const statsCards = [
    { label: 'Demandes arrivées', value: stats.arrivees, color: '#1d2d62' },
    { label: 'Demandes approuvées', value: stats.approuvees, color: '#007a33' },
    { label: 'Bons de commande', value: stats.bonsCommande, color: '#0ea5e9' },
  ];

  const demandeurStatsCards = [
    { label: 'Mes demandes', value: demandeurStats.total, color: '#1d2d62' },
    { label: 'En cours', value: demandeurStats.enCours, color: '#0ea5e9' },
    { label: 'Approuvées', value: demandeurStats.approuvees, color: '#007a33' },
    { label: 'Refusées', value: demandeurStats.refusees, color: '#dc3545' },
  ];

   return (
    <div className="space-y-6">

      {isAcheteur && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statsCards.map((stat) => (
            <div key={stat.label} className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NOUVEAU : bloc stats demandeur, même pattern que celui de l'acheteur */}
      {isDemandeur && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {demandeurStatsCards.map((stat) => (
            <div key={stat.label} className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
       )}
       
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={isDemandeur ? (request) => navigate(`/purchases/request/${request.id_da}`) : undefined}
        onDelete={isDemandeur ? (request) => request.statut === 'en_cours' && handleDelete(request) : undefined}
        onAssign={isChef ? handleAssign : undefined}
        // CHANGÉ : onView maintenant pour acheteur ET demandeur (avant : isAcheteur seul)
        onView={(isAcheteur || isDemandeur) ? handleViewFiche : undefined}
      />
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
