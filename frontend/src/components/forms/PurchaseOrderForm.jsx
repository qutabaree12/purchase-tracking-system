import FormField from '../common/FormField'

const statusOptions = [
  { value: 'en cours', label: 'En cours' },
  { value: 'annulé', label: 'Annulé' },
]

export default function PurchaseOrderForm({
  data, onChange, onItemChange, onAddItem, onRemoveItem,
  errors, supplierOptions, productOptions,
}) {
  const calculateTotal = (items) =>
    items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Fournisseur" name="supplier_id" type="select" value={data.supplier_id} onChange={onChange} required options={supplierOptions} error={errors?.supplier_id} />
        <FormField label="Date de livraison prévue" name="expected_delivery_date" type="date" value={data.expected_delivery_date} onChange={onChange} required error={errors?.expected_delivery_date} />
        <FormField label="Statut" name="status" type="select" value={data.status} onChange={onChange} options={statusOptions} error={errors?.status} />
      </div>

      <FormField label="Notes" name="notes" type="textarea" value={data.notes} onChange={onChange} error={errors?.notes} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Lignes de commande</h3>
          <button type="button" onClick={onAddItem} className="btn-primary text-xs px-3 py-1">
            + Ajouter un article
          </button>
        </div>
        {data.items.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Aucun article ajouté</p>
        ) : (
          <div className="space-y-2">
            {data.items.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <select
                    value={item.product_id}
                    onChange={(e) => onItemChange(index, 'product_id', Number(e.target.value))}
                    className="input text-sm"
                  >
                    <option value="">Sélectionner un produit</option>
                    {productOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="number"
                  placeholder="Qté"
                  value={item.quantity}
                  onChange={(e) => onItemChange(index, 'quantity', Number(e.target.value))}
                  className="input w-24 text-sm"
                  min={1}
                />
                <input
                  type="number"
                  placeholder="Prix unit."
                  value={item.unit_price}
                  onChange={(e) => onItemChange(index, 'unit_price', Number(e.target.value))}
                  className="input w-28 text-sm"
                  min={0}
                  step="0.01"
                />
                <span className="text-sm font-medium text-gray-700 w-24 text-right">
                  {(item.quantity * item.unit_price).toLocaleString()} DZD
                </span>
                <button type="button" onClick={() => onRemoveItem(index)} className="text-red-500 hover:text-red-700 text-sm">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        {data.items.length > 0 && (
          <div className="text-right mt-3 text-sm font-semibold text-gray-800">
            Total: {calculateTotal(data.items).toLocaleString()} DZD
          </div>
        )}
      </div>
    </div>
  )
}
