import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { useLayout } from '../../context/LayoutContext'
import { useAuth } from '../../context/AuthContext'
import PanierCard from '../../components/purchases/PanierCard'
import { mockRegroupement, mockGenererBonsCommande, MOCK_FOURNISSEURS } from '../../constants/mockDemandes'

const mockFournisseurs = Object.entries(MOCK_FOURNISSEURS).map(([id, f]) => ({
  id: Number(id),
  nom: f.nom,
}))

export default function Regroupement() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const idsParam = searchParams.get('ids')
  const idsDa = idsParam
    ? idsParam.split(',').map((s) => Number(s.trim())).filter(Boolean)
    : []
  const { user } = useAuth()
  const { setTitle, setSubtitle, setActions } = useLayout()
  const [paniers, setPaniers] = useState([])
  const [fournisseurs, setFournisseurs] = useState(mockFournisseurs)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectAll, setSelectAll] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [usingMock, setUsingMock] = useState(false)

  const totalEstime = useMemo(
    () =>
      paniers
        .filter((p) => p.inclus)
        .reduce((sum, p) => sum + p.produits.reduce((s, prod) => s + prod.quantite * prod.prix_unitaire, 0), 0),
    [paniers]
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, resFour] = await Promise.all([
          api.post('/regroupement/', idsDa.length ? { ids_da: idsDa } : {}),
          api.get('/fournisseurs/'),
        ])
        setUsingMock(false)
        setPaniers(res.data.paniers.map((p) => ({ ...p, inclus: true })))
        setFournisseurs(
          resFour.data.map((f) => ({ id: f.id_fournisseur, nom: f.nom_fournisseur }))
        )
      } catch {
        setUsingMock(true)
        setPaniers(mockRegroupement(user))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    setTitle('Regroupement des demandes')
    setSubtitle(
      `${paniers.length} fournisseur${paniers.length > 1 ? 's' : ''} — ${
        paniers.reduce((sum, p) => sum + p.produits.length, 0)
      } produits`
    )
  }, [paniers, setTitle, setSubtitle])

  const handleTogglePanier = (index) => {
    setPaniers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, inclus: !p.inclus } : p))
    )
  }

  const handleSelectAll = () => {
    const newVal = !selectAll
    setSelectAll(newVal)
    setPaniers((prev) => prev.map((p) => ({ ...p, inclus: newVal })))
  }

  const handleFournisseurChange = (panierIndex, fournisseurId) => {
    setPaniers((prev) =>
      prev.map((p, i) => (i === panierIndex ? { ...p, fournisseur_id: fournisseurId } : p))
    )
  }

  const handleQuantiteChange = (panierIndex, produitIndex, newQte) => {
    setPaniers((prev) =>
      prev.map((p, i) =>
        i === panierIndex
          ? {
              ...p,
              produits: p.produits.map((prod, j) =>
                j === produitIndex ? { ...prod, quantite: newQte } : prod
              ),
            }
          : p
      )
    )
  }

  const handleGenerer = async () => {
    const paniersValides = paniers.filter(
      (p) => p.inclus && p.fournisseur_id && p.produits.some((prod) => prod.quantite > 0)
    )

    if (paniersValides.length === 0) {
      setError('Sélectionnez au moins un panier avec un fournisseur et des produits.')
      return
    }

    for (const p of paniersValides) {
      if (!p.fournisseur_id) {
        setError(`Veuillez choisir un fournisseur pour le panier "${p.fournisseur_nom || p.fournisseur_id}".`)
        return
      }
    }

    setGenerating(true)
    setError(null)

    try {
      if (usingMock) {
        mockGenererBonsCommande(paniersValides)
      } else {
        await api.post('/bons-commande/generer/', { paniers: paniersValides })
      }
      navigate('/purchases/orders')
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la génération. Veuillez réessayer.')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/purchases/requests')} className="btn-secondary">
          Retour
        </button>
        <button onClick={handleGenerer} disabled={generating} className="btn-primary">
          {generating ? 'Génération en cours...' : 'Générer le bon de commande'}
        </button>
      </div>
    )
  }, [generating, paniers, navigate, setActions])

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-8 text-gray-500">Chargement du regroupement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="space-y-4">
        {paniers.map((panier, index) => (
          <PanierCard
            key={panier.fournisseur_id ?? panier.categorie}
            panier={panier}
            fournisseurs={fournisseurs}
            index={index}
            onToggle={handleTogglePanier}
            onFournisseurChange={handleFournisseurChange}
            onQuantiteChange={handleQuantiteChange}
          />
        ))}
      </div>

      <div className="card">
        <div className="card-body flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-brand-border text-brand-green focus:ring-brand-green"
              style={{ borderRadius: 4 }}
            />
            <span className="text-sm font-medium text-gray-700">Tout sélectionner</span>
          </label>
          <span className="text-sm text-gray-500">
            Total estimé :{' '}
            <span className="font-semibold text-brand-navy tabular-nums">
              {totalEstime.toLocaleString()} DZD
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
