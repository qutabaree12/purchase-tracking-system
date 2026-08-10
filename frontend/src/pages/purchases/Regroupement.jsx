import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useLayout } from '../../context/LayoutContext'
import PanierCard from '../../components/purchases/PanierCard'

const mockFournisseurs = [
  { id: 1, nom: 'HP Algérie' },
  { id: 2, nom: 'Bureau Plus' },
  { id: 3, nom: 'Green Supply' },
  { id: 4, nom: 'Paper & Co' },
]

const mockPaniers = [
  {
    categorie: 'Bureautique',
    inclus: true,
    fournisseur_id: 1,
    produits: [
      { produit_id: 1, nom: 'PC Portable', quantite: 21, prix_unitaire: 150000 },
      { produit_id: 2, nom: 'Clavier', quantite: 3, prix_unitaire: 5000 },
      { produit_id: 3, nom: 'Souris', quantite: 15, prix_unitaire: 2500 },
    ],
  },
  {
    categorie: 'Mobilier',
    inclus: true,
    fournisseur_id: 2,
    produits: [
      { produit_id: 4, nom: 'Bureau', quantite: 3, prix_unitaire: 80000 },
      { produit_id: 5, nom: 'Chaise', quantite: 8, prix_unitaire: 25000 },
    ],
  },
  {
    categorie: 'Plantes',
    inclus: true,
    fournisseur_id: 3,
    produits: [
      { produit_id: 6, nom: 'Plante verte', quantite: 7, prix_unitaire: 3000 },
    ],
  },
  {
    categorie: 'Papeterie',
    inclus: true,
    fournisseur_id: 4,
    produits: [
      { produit_id: 7, nom: 'Stylo', quantite: 4, prix_unitaire: 500 },
      { produit_id: 8, nom: 'Cahier', quantite: 10, prix_unitaire: 1200 },
    ],
  },
]

export default function Regroupement() {
  const navigate = useNavigate()
  const { setTitle, setSubtitle, setActions } = useLayout()
  const [paniers, setPaniers] = useState([])
  const [fournisseurs, setFournisseurs] = useState(mockFournisseurs)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectAll, setSelectAll] = useState(true)
  const [generating, setGenerating] = useState(false)

  const totalEstime = useMemo(
    () =>
      paniers
        .filter((p) => p.inclus)
        .reduce((sum, p) => sum + p.produits.reduce((s, prod) => s + prod.quantite * prod.prix_unitaire, 0), 0),
    [paniers]
  )

  useEffect(() => {
    setTitle('Regroupement des demandes')
    setSubtitle(
      `${paniers.length} catégorie${paniers.length > 1 ? 's' : ''} — ${
        paniers.reduce((sum, p) => sum + p.produits.length, 0)
      } produits`
    )
  
    return () => {
      setTitle('')
      setSubtitle('')
    }
  }, [paniers, setTitle, setSubtitle])


  useEffect(() => {
    setActions(
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/purchases/requests')}
          className="btn-secondary"
        >
          Retour
        </button>
  
        <button
          onClick={handleGenerer}
          disabled={generating}
          className="btn-primary"
        >
          {generating
            ? 'Génération en cours...'
            : 'Générer le bon de commande'}
        </button>
      </div>
    )
  
    return () => {
      setActions(null)
    }
  }, [generating, paniers, navigate, setActions])

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
        setError(`Veuillez choisir un fournisseur pour le panier "${p.categorie}".`)
        return
      }
    }

    setGenerating(true)
    setError(null)

    try {
      await api.post('/bons-commande/generer/', { paniers: paniersValides })
      navigate('/purchases/orders')
    } catch {
      setError('Erreur lors de la génération. Veuillez réessayer.')
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
            key={panier.categorie}
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
