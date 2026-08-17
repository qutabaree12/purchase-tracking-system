export default function PanierCard({ panier, fournisseurs, index, onToggle, onFournisseurChange, onQuantiteChange }) {
  const totalPanier = panier.produits.reduce((sum, p) => sum + p.quantite * p.prix_unitaire, 0)

  return (
    <div className={`bg-white rounded-[10px] overflow-hidden transition-all ${
      panier.inclus ? 'border border-brand-line shadow-sm' : 'border border-brand-line opacity-60'
    }`}>
      {/* En-tête fournisseur */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: '#1a2b5c' }}>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center justify-center w-4 h-4 cursor-pointer">
            <input
              type="checkbox"
              checked={panier.inclus}
              onChange={() => onToggle(index)}
              className="peer appearance-none w-4 h-4 rounded border border-white/50 bg-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 checked:bg-[#007a33] checked:border-[#007a33]"
              style={{ borderRadius: 4 }}
            />
            <svg
              className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </label>
          <h3 className="font-bold text-white">{panier.fournisseur_nom || `Fournisseur ${panier.fournisseur_id}`}</h3>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            ({panier.produits.length} produits)
          </span>
        </div>
        <span className="text-white font-medium tabular-nums text-[15px]">
          {totalPanier.toLocaleString()} DZD
        </span>
      </div>

      {/* Corps */}
      <div className="px-5 py-4 space-y-4">
        {/* Fournisseur */}
        <div className="flex items-center gap-2">
          <label className="text-[12px] font-medium text-gray-500 whitespace-nowrap">Fournisseur</label>
          <div className="relative max-w-xs w-full">
            <select
              value={panier.fournisseur_id || ''}
              onChange={(e) => onFournisseurChange(index, Number(e.target.value))}
              disabled={!panier.inclus}
              className="appearance-none w-full bg-white px-3 text-sm text-gray-700 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              style={{
                padding: '7px 30px 7px 12px',
                border: '1px solid #dee2e6',
                borderRadius: 8,
              }}
            >
              <option value="">Sélectionner un fournisseur</option>
              {fournisseurs.map((f) => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: 13 }}>
            <thead>
              <tr className="border-b border-brand-line">
                <th className="px-3 py-2 text-left font-medium text-gray-500" style={{ fontSize: 12 }}>Produit</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500" style={{ fontSize: 12 }}>Prix unitaire</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500" style={{ fontSize: 12 }}>Quantité</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500" style={{ fontSize: 12 }}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {panier.produits.map((produit, pIdx) => (
                <tr key={produit.produit_id} className="hover:bg-brand-rowhover transition-colors">
                  <td className="px-3 py-2 text-gray-800">{produit.nom}</td>
                  <td className="px-3 py-2 text-right text-gray-500 tabular-nums">
                    {produit.prix_unitaire.toLocaleString()} DZD
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      value={produit.quantite}
                      onChange={(e) => onQuantiteChange(index, pIdx, Math.max(0, Number(e.target.value)))}
                      disabled={!panier.inclus}
                      className="bg-white px-2 py-1 text-center text-sm text-gray-700 focus:outline-none disabled:bg-gray-100"
                      style={{
                        width: 56,
                        border: '1px solid #dee2e6',
                        borderRadius: 6,
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-800 tabular-nums">
                    {(produit.quantite * produit.prix_unitaire).toLocaleString()} DZD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sous-total */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
        <span className="text-[13px] text-gray-500">Sous-total fournisseur</span>
        <span className="text-[16px] font-bold text-brand-navy tabular-nums">{totalPanier.toLocaleString()} DZD</span>
      </div>
    </div>
  )
}
