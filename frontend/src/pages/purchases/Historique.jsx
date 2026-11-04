import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { formatDate } from '../../utils/format'

const liste = (res) => (Array.isArray(res.data) ? res.data : res.data.results || [])

export default function Historique() {
  const [dossiers, setDossiers] = useState([])
  const [receptions, setReceptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [ouvert, setOuvert] = useState(null)   // id du dossier déplié

  useEffect(() => {
    let active = true
    Promise.all([api.get('/dossiers-importation/'), api.get('/receptions/')])
      .then(([d, r]) => {
        if (!active) return
        setDossiers(liste(d))
        setReceptions(liste(r))
      })
      .catch((err) => {
        if (active) setErreur(err.response?.data?.detail || "Erreur lors du chargement de l'historique.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Dossiers livrés, du plus récent au plus ancien, avec leurs réceptions
  const livres = useMemo(() => {
    const parDossier = {}
    receptions.forEach((r) => {
      ;(parDossier[r.id_dossier] = parDossier[r.id_dossier] || []).push(r)
    })
    const q = recherche.trim().toLowerCase()
    return dossiers
      .filter((d) => d.statut === 'livré')
      .filter((d) => !q || `${d.bc_reference} ${d.fournisseur_nom}`.toLowerCase().includes(q))
      .sort((a, b) => String(b.date_reception_reelle || '').localeCompare(String(a.date_reception_reelle || '')))
      .map((d) => ({ ...d, receptions: parDossier[d.id_dossier] || [] }))
  }, [dossiers, receptions, recherche])

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Dossiers entièrement réceptionnés, avec le détail de chaque réception.
      </p>

      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erreur}</div>
      )}

      <input
        type="text"
        className="input w-full max-w-md"
        placeholder="Rechercher un BC ou un fournisseur…"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600">N° BC</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Fournisseur</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Livré le</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Réceptions</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : livres.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {dossiers.length === 0
                      ? 'Aucun dossier ne vous est encore assigné.'
                      : 'Aucun dossier livré pour le moment.'}
                  </td>
                </tr>
              ) : (
                livres.map((d) => (
                  <FragmentLigne
                    key={d.id_dossier}
                    dossier={d}
                    ouvert={ouvert === d.id_dossier}
                    onBasculer={() => setOuvert(ouvert === d.id_dossier ? null : d.id_dossier)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FragmentLigne({ dossier, ouvert, onBasculer }) {
  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 font-semibold text-gray-800">{dossier.bc_reference}</td>
        <td className="px-4 py-3 text-gray-700">{dossier.fournisseur_nom}</td>
        <td className="px-4 py-3 text-gray-700">
          {dossier.date_reception_reelle ? formatDate(dossier.date_reception_reelle) : '—'}
        </td>
        <td className="px-4 py-3 text-right tabular-nums">{dossier.receptions.length}</td>
        <td className="px-4 py-3 text-right">
          <button type="button" className="text-blue-600 hover:underline" onClick={onBasculer}>
            {ouvert ? 'Masquer' : 'Voir'}
          </button>
        </td>
      </tr>
      {ouvert && (
        <tr className="bg-gray-50/60">
          <td colSpan={5} className="px-6 py-4">
            {dossier.receptions.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aucune réception détaillée : ce dossier a été livré avant la réception par ligne.
              </p>
            ) : (
              <div className="space-y-3">
                {dossier.receptions.map((r) => (
                  <div key={r.id_reception} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <p className="text-sm font-semibold">
                      Réception du {formatDate(r.date_reception)}
                      {r.remarque ? <span className="font-normal text-gray-500"> · {r.remarque}</span> : null}
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-gray-700">
                      {r.lignes.map((l) => (
                        <li key={l.num_ligne_bc}>
                          {l.produit_nom} : <span className="font-medium tabular-nums">{l.quantite_recue}</span>
                          {l.reserve ? <span className="text-amber-700"> · réserve : {l.reserve}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
