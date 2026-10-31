import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api'

const TYPES = [
  { value: 'facture', label: 'Facture commerciale', obligatoire: true },
  { value: 'colisage', label: 'Liste de colisage', obligatoire: true },
  { value: 'origine', label: "Certificat d'origine", obligatoire: true },
  { value: 'transport', label: 'Titre de transport', obligatoire: true },
  { value: 'assurance', label: 'Assurance', obligatoire: false },
  { value: 'autre', label: 'Autre', obligatoire: false },
]

function formatTaille(octets) {
  if (octets == null) return ''
  if (octets < 1024 * 1024) return `${Math.max(1, Math.round(octets / 1024))} Ko`
  return `${(octets / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
}

export default function DocumentsPanel({ dossierId, canEdit = false }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [type, setType] = useState('facture')
  const [fichier, setFichier] = useState(null)
  const [inputKey, setInputKey] = useState(0)
  const [envoi, setEnvoi] = useState(false)

  const charger = useCallback(async () => {
    try {
      const res = await api.get(`/documents-dossier/?dossier=${dossierId}`)
      setDocuments(Array.isArray(res.data) ? res.data : res.data.results || [])
    } catch {
      setError('Impossible de charger les pièces justificatives.')
    } finally {
      setLoading(false)
    }
  }, [dossierId])

  useEffect(() => {
    charger()
  }, [charger])

  const deposer = async () => {
    if (!fichier) {
      setError('Choisissez un fichier.')
      return
    }
    const data = new FormData()
    data.append('dossier', dossierId)
    data.append('type', type)
    data.append('fichier', fichier)
    setEnvoi(true)
    setError(null)
    try {
      await api.post('/documents-dossier/', data)
      setFichier(null)
      setInputKey((k) => k + 1)
      await charger()
    } catch (err) {
      setError(err.response?.data?.detail || "Échec de l'envoi du fichier.")
    } finally {
      setEnvoi(false)
    }
  }

  const supprimer = async (doc) => {
    if (!window.confirm(`Supprimer « ${doc.nom_fichier} » ?`)) return
    try {
      await api.delete(`/documents-dossier/${doc.id_document}/`)
      await charger()
    } catch (err) {
      setError(err.response?.data?.detail || 'Suppression impossible.')
    }
  }

  const telecharger = async (doc) => {
    try {
      const res = await api.get(`/documents-dossier/${doc.id_document}/telecharger/`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(res.data)
      const lien = window.document.createElement('a')
      lien.href = url
      lien.download = doc.nom_fichier
      window.document.body.appendChild(lien)
      lien.click()
      lien.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Téléchargement impossible.')
    }
  }

  const manquantes = TYPES.filter(
    (t) => t.obligatoire && !documents.some((d) => d.type === t.value)
  )

  return (
    <div className="border-t border-gray-200 pt-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Pièces justificatives</h3>

      {error && (
        <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {!loading && (
        manquantes.length === 0 ? (
          <p className="mb-3 text-sm text-emerald-600">Toutes les pièces obligatoires sont déposées.</p>
        ) : (
          <p className="mb-3 text-sm text-amber-600">
            Pièces obligatoires manquantes : {manquantes.map((t) => t.label).join(', ')}.
          </p>
        )
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Chargement...</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune pièce déposée.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {documents.map((doc) => (
            <li key={doc.id_document} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{doc.type_label} · {doc.nom_fichier}</p>
                <p className="text-xs text-gray-500">
                  {formatTaille(doc.taille)} · déposé par {doc.depose_par_nom} le{' '}
                  {new Date(doc.date_depot).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => telecharger(doc)} className="text-blue-600 hover:underline">
                  Télécharger
                </button>
                {canEdit && (
                  <button type="button" onClick={() => supprimer(doc)} className="text-red-600 hover:underline">
                    Supprimer
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select value={type} onChange={(e) => setType(e.target.value)} className="input" style={{ width: 'auto' }}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input
            key={inputKey}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setFichier(e.target.files[0] || null)}
            className="text-sm"
          />
          <button type="button" onClick={deposer} disabled={envoi || !fichier} className="btn-primary">
            {envoi ? 'Envoi...' : 'Déposer'}
          </button>
          <span className="text-xs text-gray-500">PDF, PNG ou JPG, 5 Mo maximum.</span>
        </div>
      )}
    </div>
  )
}
