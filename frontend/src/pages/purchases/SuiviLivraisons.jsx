import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import EtapeBadge from '../../components/common/EtapeBadge'
import { formatDate } from '../../utils/format'
import { etapeSuivi } from '../../utils/suivi'

const FILTRES = [
  { value: 'toutes', label: 'Toutes', test: () => true },
  { value: 'preparation', label: 'En préparation', test: (e) => e === 'attente_bc' || e === 'a_traiter' },
  { value: 'en_cours', label: 'En cours', test: (e) => e === 'en_cours' },
  { value: 'livre', label: 'Livrées', test: (e) => e === 'livre' },
]

export default function SuiviLivraisons() {
  const navigate = useNavigate()
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtre, setFiltre] = useState('toutes')

  useEffect(() => {
    let active = true
    api
      .get('/demandes/?statut=approuvee')
      .then((res) => {
        if (active) setDemandes(res.data || [])
      })
      .catch(() => {
        if (active) setError('Erreur lors du chargement du suivi.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Une ligne par commande ; une DA sans BC donne une seule ligne "en attente"
  const lignes = useMemo(() => {
    const rows = []
    demandes.forEach((d) => {
      if (!d.suivi || d.suivi.length === 0) {
        rows.push({ key: `da-${d.id_da}`, demande: d, bc: null, etape: 'attente_bc' })
      } else {
        d.suivi.forEach((bc) =>
          rows.push({ key: `bc-${bc.id_bc}-${d.id_da}`, demande: d, bc, etape: etapeSuivi(bc) })
        )
      }
    })
    return rows
  }, [demandes])

  const test = FILTRES.find((f) => f.value === filtre).test
  const visibles = lignes.filter((r) => test(r.etape))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          Avancement de vos demandes approuvées, du bon de commande jusqu'à la livraison.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTRES.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltre(f.value)}
            className={filtre === f.value ? 'btn-primary' : 'btn-secondary'}
          >
            {f.label} ({lignes.filter((r) => f.test(r.etape)).length})
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600">N° DA</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Objet</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Bon de commande</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Étape</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Livraison prévue</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Reçue le</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : visibles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Aucune demande dans cette catégorie.
                  </td>
                </tr>
              ) : (
                visibles.map((r) => (
                  <tr key={r.key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">{r.demande.numero_da}</td>
                    <td className="px-4 py-3 text-gray-700">{r.demande.objet}</td>
                    <td className="px-4 py-3 text-gray-700">{r.bc ? r.bc.reference : '—'}</td>
                    <td className="px-4 py-3"><EtapeBadge etape={r.etape} /></td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.bc?.date_livraison_prevue ? formatDate(r.bc.date_livraison_prevue) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.bc?.date_reception_reelle ? formatDate(r.bc.date_reception_reelle) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => navigate(`/purchases/request/${r.demande.id_da}/fiche`)}
                      >
                        Fiche
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
