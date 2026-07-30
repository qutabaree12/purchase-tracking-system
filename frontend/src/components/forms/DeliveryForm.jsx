import FormField from '../common/FormField'

const statusOptions = [
  { value: 'pending', label: 'En attente' },
  { value: 'partial', label: 'Partielle' },
  { value: 'completed', label: 'Complétée' },
  { value: 'cancelled', label: 'Annulée' },
]

export default function DeliveryForm({
  data, onChange, onItemChange, onAddItem, onRemoveItem,
  errors, purchaseOrderOptions, productOptions,
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Bon de commande" name="purchase_order_id" type="select" value={data.purchase_order_id} onChange={onChange} required options={purchaseOrderOptions} error={errors?.purchase_order_id} />
        <FormField label="Date de réception" name="delivery_date" type="date" value={data.delivery_date} onChange={onChange} required error={errors?.delivery_date} />
        <FormField label="Reçu par" name="received_by" type="text" value={data.received_by} onChange={onChange} required error={errors?.received_by} />
      </div>

      <FormField label="Statut" name="status" type="select" value={data.status} onChange={onChange} options={statusOptions} error={errors?.status} />
      <FormField label="Notes" name="notes" type="textarea" value={data.notes} onChange={onChange} error={errors?.notes} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Articles reçus</h3>
          <button type="button" onClick={onAddItem} className="btn-primary text-xs px-3 py-1">
            + Ajouter un article
          </button>
        </div>
        {data.items.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
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
              placeholder="Qté reçue"
              value={item.quantity_received}
              onChange={(e) => onItemChange(index, 'quantity_received', Number(e.target.value))}
              className="input w-24 text-sm"
              min={0}
            />
            <label className="flex items-center gap-1 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={item.condition_ok}
                onChange={(e) => onItemChange(index, 'condition_ok', e.target.checked)}
                className="rounded border-gray-300"
              />
              Bon état
            </label>
            <button type="button" onClick={() => onRemoveItem(index)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
