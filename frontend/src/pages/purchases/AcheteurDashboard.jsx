import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/common/StatCard'
import EtatDossierBadge from '../../components/common/EtatDossierBadge'
import { ETATS_DOSSIER, etatDossier } from '../../utils/etatDossier'
import { formatDate } from '../../utils/format'

const liste = (res) => (Array.isArray(res.data) ? res.data : res.data.results || [])

export default function AcheteurDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [demandes, setDemandes] = useState([])
  const [bons, setBons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([api.get('/demandes/'), api.get('/bons-commande/')])
      .then(([d, b]) => {
        if (!active) return
        setDemandes(liste(d))
        setBons(liste(b))
      })
      .catch(() => {
        if (active) setError('Impossible de charger votre tableau de bord.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const calc = useMemo(() => {
    const aTraiter = demandes.filter((d) => d.statut === 'en_cours')
    const aCommander = demandes.filter((d) => d.statut === 'approuvee' && d.reste_a_commander)
    const lignes = bons.map((bc) => ({
      bc,
      etat: etatDossier({
        id_transitaire: bc.id_transitaire ?? null,
        statut: bc.dossier_statut,
        statut_controle: bc.dossier_controle,
        pret_pour_controle: bc.dossier_pret,
      }),
    }))
    const parEtat = {}
    lignes.forEach((l) => {
      parEtat[l.etat] = (parEtat[l.etat] || 0) + 1
    })
    return {
      aTraiter,
      aCommander,
      sansTransitaire: lignes.filter((l) => l.etat === 'sans_transitaire').map((l) => l.bc),
      parEtat,
    }
  }, [demandes, bons])

  const prenom = (user?.full_name || '').split(' ')[0]

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-3xl bg-gray-200/60 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Bonjour{prenom ? `, ${prenom}` : ''}</h2>
        <p className="text-sm text-gray-500">Ce qui demande votre attention aujourd'hui.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Demandes à traiter" value={calc.aTraiter.length} icon="file" tone="blue" delay={0}
          hint={calc.aTraiter.length > 0 ? 'À approuver ou refuser' : 'Rien en attente'}
          onClick={() => navigate('/purchases/requests')} />
        <StatCard label="À commander" value={calc.aCommander.length} icon="check" tone="emerald" delay={60}
          hint="Demandes approuvées sans bon de commande"
          onClick={() => navigate('/purchases/approved-requests')} />
        <StatCard label="BC sans transitaire" value={calc.sansTransitaire.length} icon="clock" tone="rose" delay={120}
          hint={calc.sansTransitaire.length > 0 ? 'Action requise de votre part' : 'Tous les BC ont un transitaire'}
          onClick={() => navigate('/purchases/orders')} />
        <StatCard label="Dossiers livrés" value={calc.parEtat.livre || 0} icon="box" tone="sky" delay={180}
          onClick={() => navigate('/purchases/orders')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Demandes à traiter</span>
            <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}
              onClick={() => navigate('/purchases/requests')}>Voir tout</button>
          </div>
          {calc.aTraiter.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">Aucune demande en attente.</p>
          ) : (
            calc.aTraiter.slice(0, 5).map((d) => (
              <div key={d.id_da}
                onClick={() => navigate(`/purchases/request/${d.id_da}/fiche`)}
                className="px-6 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors">
                <p className="text-sm font-semibold truncate">{d.numero_da} · {d.objet}</p>
                <p className="text-xs text-gray-500 mt-0.5">{d.demandeur_nom} · {formatDate(d.date_creation)}</p>
              </div>
            ))
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">BC sans transitaire</span>
            <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}
              onClick={() => navigate('/purchases/orders')}>Voir tout</button>
          </div>
          {calc.sansTransitaire.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">Tous vos bons de commande ont un transitaire.</p>
          ) : (
            calc.sansTransitaire.slice(0, 5).map((bc) => (
              <div key={bc.id_bc}
                onClick={() => navigate(`/purchases/order/${bc.id_bc}/fiche`)}
                className="px-6 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors">
                <p className="text-sm font-semibold">{bc.reference} · {bc.fournisseur_nom}</p>
                <p className="text-xs text-gray-500 mt-0.5">Créé le {formatDate(bc.date_creation)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Avancement des dossiers d'importation</span>
        </div>
        <div className="card-body flex flex-wrap gap-x-8 gap-y-3">
          {Object.keys(ETATS_DOSSIER).filter((cle) => calc.parEtat[cle]).length === 0 ? (
            <p className="text-sm text-gray-500">Aucun dossier pour le moment.</p>
          ) : (
            Object.keys(ETATS_DOSSIER)
              .filter((cle) => calc.parEtat[cle])
              .map((cle) => (
                <div key={cle} className="flex items-center gap-2">
                  <EtatDossierBadge etat={cle} />
                  <span className="text-sm font-semibold tabular-nums">{calc.parEtat[cle]}</span>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
