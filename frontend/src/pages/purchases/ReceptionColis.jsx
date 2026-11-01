import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api'
import { formatDate } from '../../utils/format'

export default function ReceptionColis() {
  const [dossiers, setDossiers] = useState([])
  const [saisies, setSaisies] = useState({})      // { [id_dossier]: { [num_ligne_bc]: '3' } }
  const [remarques, setRemarques] = useState({})  // { [id_dossier]: 'texte' }
  const [loading, setLoading] = useState(true)
  const [envoiEn, setEnvoiEn] = useState(null)    // id du dossier en cours d'envoi
  const [erreur, setErreur] = useState(null)
  const [message, setMessage] = useState(null)

  const charger = useCallback(async () => {
    try {
      const res = await api.get('/receptions/a-recevoir/')
      setDossiers(Array.isArray(res.data) ? res.data : res.data.results || [])
    } catch (err) {
      setErreur(err.response?.data?.detail || 'Erreur lors du chargement des réceptions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  const changer = (idDossier, numLigne, valeur) => {
    setSaisies((prev) => ({
      ...prev,
      [idDossier]: { ...(prev[idDossier] || {}), [numLigne]: valeur },
    }))
  }

  const toutRecevoir = (dossier) => {
    const complet = {}
    dossier.lignes.forEach((l) => {
      if (l.restant > 0) complet[l.num_ligne_bc] = String(l.restant)
    })
    setSaisies((prev) => ({ ...prev, [dossier.id_dossier]: complet }))
  }

  const enregistrer = async (dossier) => {
    const lignes = dossier.lignes
      .map((l) => ({
        num_ligne_bc: l.num_ligne_bc,
        quantite: Number(saisies[dossier.id_dossier]?.[l.num_ligne_bc] || 0),
      }))
      .filter((l) => l.quantite > 0)

    setErreur(null)
    setMessage(null)
    if (lignes.length === 0) {
      setErreur('Indiquez au moins une quantité reçue.')
      return
    }

    setEnvoiEn(dossier.id_dossier)
    try {
      const res = await api.post('/receptions/', {
        id_dossier: dossier.id_dossier,
        lignes,
        remarque: remarques[dossier.id_dossier] || '',
      })
      setMessage(`${dossier.bc_reference} : ${res.data.detail}`)
      setSaisies((prev) => ({ ...prev, [dossier.id_dossier]: {} }))
      setRemarques((prev) => ({ ...prev, [dossier.id_dossier]: '' }))
      window.dispatchEvent(new Event('notifications:refresh'))
      await charger()
    } catch (err) {
      setErreur(err.response?.data?.detail || "Erreur lors de l'enregistrement de la réception.")
    } finally {
      setEnvoiEn(null)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Enregistrez ce qui a été reçu, ligne par ligne. Vous pouvez recevoir en plusieurs fois :
        le dossier est livré lorsque toutes les lignes sont complètes.
      </p>

      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erreur}</div>
      )}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{message}</div>
      )}

      {loading ? (
        <div className="card">
          <div className="card-body text-center py-8 text-gray-500">Chargement...</div>
        </div>
      ) : dossiers.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-8 text-gray-500">
            Aucun dossier à réceptionner pour le moment. Un dossier apparaît ici une fois validé par le contrôleur.
          </div>
        </div>
      ) : (
        dossiers.map((dossier) => (
          <div key={dossier.id_dossier} className="card overflow-hidden">
            <div className="card-header flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                {dossier.bc_reference} · {dossier.fournisseur_nom}
              </span>
              <span className="text-xs text-gray-500">
                Livraison prévue : {dossier.date_livraison_prevue ? formatDate(dossier.date_livraison_prevue) : '—'}
              </span>
            </div>

            {dossier.bloque && (
              <div className="mx-6 mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {dossier.bloque} : la réception est bloquée tant qu'elle n'est pas obtenue.
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Produit</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Commandé</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Déjà reçu</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Reste</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Reçu maintenant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dossier.lignes.map((l) => (
                    <tr key={l.num_ligne_bc}>
                      <td className="px-4 py-3 text-gray-700">{l.produit_nom}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{l.commande}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{l.recu}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{l.restant}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          max={l.restant}
                          className="input w-24 text-right"
                          value={saisies[dossier.id_dossier]?.[l.num_ligne_bc] ?? ''}
                          onChange={(e) => changer(dossier.id_dossier, l.num_ligne_bc, e.target.value)}
                          disabled={l.restant === 0 || !!dossier.bloque || envoiEn === dossier.id_dossier}
                          placeholder={l.restant === 0 ? 'Complet' : '0'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card-body flex flex-wrap items-center gap-3">
              <input
                type="text"
                className="input flex-1 min-w-[200px]"
                placeholder="Remarque (facultative) : colis abîmé, retard…"
                maxLength={500}
                value={remarques[dossier.id_dossier] || ''}
                onChange={(e) => setRemarques((prev) => ({ ...prev, [dossier.id_dossier]: e.target.value }))}
                disabled={!!dossier.bloque || envoiEn === dossier.id_dossier}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => toutRecevoir(dossier)}
                disabled={!!dossier.bloque || envoiEn === dossier.id_dossier}
              >
                Tout recevoir
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => enregistrer(dossier)}
                disabled={!!dossier.bloque || envoiEn === dossier.id_dossier}
              >
                {envoiEn === dossier.id_dossier ? 'Enregistrement...' : 'Enregistrer la réception'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
