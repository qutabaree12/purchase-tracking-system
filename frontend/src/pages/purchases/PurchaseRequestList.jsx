import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Select from "../../components/common/Select";

import { formatDate } from "../../utils/format";


export default function PurchaseRequestList() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.role;
  const isAcheteur = role === 'acheteur';
  const isDemandeur = role === 'demandeur';
  const isChef = role === 'chef département';
  const canCreate = !['acheteur', 'chef département'].includes(role);

  const [data, setData] = useState([]);
  const [demandeurFilter, setDemandeurFilter] = useState('toutes');
  const [chefFilter, setChefFilter] = useState('toutes');
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

  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const demandesRes = await api.get('/demandes/');
        if (!active) return;

        const toutes = demandesRes.data || [];
        const demandesVisibles = isDemandeur
          ? toutes
          : toutes.filter((d) => d.statut !== 'approuvee');
        
        setData(demandesVisibles);

        if (isAcheteur) {
          const [approuveesRes, bonsRes] = await Promise.all([
            api.get('/demandes/?statut=approuvee'),
            api.get('/bons-commande/'),
          ]);
          if (!active) return;
          setStats({
            arrivees: toutes.filter((d) => d.statut !== 'approuvee').length,
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
      } catch {
        if (active) setError('Erreur lors du chargement des demandes.');
      }

      if (active) setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [isAcheteur, isDemandeur, user]);  // isDemandeur ajouté aux dépendances



    // Filtre utilisé uniquement pour le demandeur
    const demandeurFilteredData = isDemandeur
    ? data.filter((demande) => {
        if (demandeurFilter === 'toutes') return true;
        return demande.statut === demandeurFilter;
      })
    : data;

  // Filtre utilisé uniquement pour le chef de département
  const filteredData = isChef
    ? demandeurFilteredData.filter((demande) => {
        if (chefFilter === 'toutes') return true;
        if (chefFilter === 'sans_acheteur') return !demande.acheteur_nom;
        if (chefFilter === 'avec_acheteur') return !!demande.acheteur_nom;
        return true;
      })
    : demandeurFilteredData;

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
    if (assignLoading) return;  // AJOUT : bloque si une requête est déjà en cours
  
    if (!selectedAcheteur) {
      setAssignError("Veuillez choisir un acheteur.");
      return;
    }
  
    setAssignLoading(true);  // AJOUT
    setAssignError('');      // AJOUT : nettoie une éventuelle erreur précédente
  
    try {
      await api.post(`/demandes/${selectedRequestId}/assigner_acheteur/`, {
        acheteur_id: Number(selectedAcheteur),
      })
      setOpenAssign(false)
    } catch (err) {
      setAssignError(err.response?.data?.detail || "Erreur lors de l'assignation.")
    } finally {
      setAssignLoading(false);  // AJOUT : réactive dans tous les cas
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
    { label: 'Demandes arrivées', value: stats.arrivees, path: '/purchases/requests', tone: 'bg-blue-500/10 text-blue-700 ring-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25' },
    { label: 'Demandes approuvées', value: stats.approuvees, path: '/purchases/approved-requests', tone: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25' },
    { label: 'Bons de commande', value: stats.bonsCommande, path: '/purchases/orders', tone: 'bg-sky-500/10 text-sky-700 ring-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/25' },
  ];

  const demandeurStatsCards = [
    { label: 'Mes demandes', value: demandeurStats.total, filter: 'toutes', tone: 'bg-blue-500/10 text-blue-700 ring-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25' },
    { label: 'En cours', value: demandeurStats.enCours, filter: 'en_cours', tone: 'bg-sky-500/10 text-sky-700 ring-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/25' },
    { label: 'Approuvées', value: demandeurStats.approuvees, filter: 'approuvee', tone: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25' },
    { label: 'Refusées', value: demandeurStats.refusees, filter: 'refusee', tone: 'bg-rose-500/10 text-rose-700 ring-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25' },
  ];

   return (
    <div className="space-y-6">

      {isAcheteur && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statsCards.map((stat) => (
            <div
              key={stat.label}
              onClick={() => navigate(stat.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(stat.path)
                }
              }}
              className={`rounded-2xl p-5 ring-1 shadow-sm cursor-pointer hover:brightness-95 transition ${stat.tone}`}
            >
              <p className="text-[12px] font-semibold uppercase tracking-wide opacity-75">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* NOUVEAU : bloc stats demandeur, même pattern que celui de l'acheteur */}
      {isDemandeur && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {demandeurStatsCards.map((stat) => (
            <div
              key={stat.label}
              onClick={() => setDemandeurFilter(stat.filter)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setDemandeurFilter(stat.filter);
                }
              }}
              className={`rounded-2xl p-5 ring-1 shadow-sm cursor-pointer hover:brightness-95 transition ${stat.tone}`}
            >
              <p className="text-[12px] font-semibold uppercase tracking-wide opacity-75">
                {stat.label}
              </p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

              {isChef && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    onClick={() => setChefFilter('toutes')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setChefFilter('toutes') } }}
                    className="rounded-2xl p-5 ring-1 shadow-sm cursor-pointer hover:brightness-95 transition bg-blue-500/10 text-blue-700 ring-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25"
                  >
                    <p className="text-[12px] font-semibold uppercase tracking-wide opacity-75">Demandes du département</p>
                    <p className="text-3xl font-bold mt-2">{data.length}</p>
                  </div>
                  <div
                    onClick={() => setChefFilter('sans_acheteur')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setChefFilter('sans_acheteur') } }}
                    className="rounded-2xl p-5 ring-1 shadow-sm cursor-pointer hover:brightness-95 transition bg-rose-500/10 text-rose-700 ring-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25"
                  >
                    <p className="text-[12px] font-semibold uppercase tracking-wide opacity-75">Sans acheteur assigné</p>
                    <p className="text-3xl font-bold mt-2">{data.filter((d) => !d.acheteur_nom).length}</p>
                  </div>
                  <div
                    onClick={() => setChefFilter('avec_acheteur')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setChefFilter('avec_acheteur') } }}
                    className="rounded-2xl p-5 ring-1 shadow-sm cursor-pointer hover:brightness-95 transition bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25"
                  >
                    <p className="text-[12px] font-semibold uppercase tracking-wide opacity-75">Assignées</p>
                    <p className="text-3xl font-bold mt-2">{data.filter((d) => d.acheteur_nom).length}</p>
                  </div>
                </div>
              )}
        
              <div className="flex justify-between items-center">
        <div>

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
        data={filteredData}
        loading={loading}
        onEdit={isDemandeur ? (request) => navigate(`/purchases/request/${request.id_da}`) : undefined}
        onDelete={isDemandeur ? (request) => request.statut === 'en_cours' && handleDelete(request) : undefined}
        onAssign={isChef ? handleAssign : undefined}
        // CHANGÉ : onView maintenant pour acheteur ET demandeur (avant : isAcheteur seul)
        onView={(isAcheteur || isDemandeur || isChef) ? handleViewFiche : undefined}
      />
      {/* Assignation acheteur (chef département) */}
      <ConfirmDialog
        open={openAssign}
        title="Choisir un acheteur"
        confirmLabel="Assigner"
        cancelLabel="Annuler"
        loading={assignLoading}
        onConfirm={handleConfirmAssign}
        onCancel={() => setOpenAssign(false)}
      >
        <div className="space-y-3">
          <label className="label">Acheteur</label>
          <Select
            value={selectedAcheteur}
            onChange={(e) => setSelectedAcheteur(e.target.value)}
            options={acheteurs.map((a) => ({ value: a.id_emp, label: a.full_name }))}
            placeholder="Sélectionner un acheteur..."
          />
          {assignError && <p className="text-sm text-red-600">{assignError}</p>}
        </div>
      </ConfirmDialog>

    </div>
  );
}
