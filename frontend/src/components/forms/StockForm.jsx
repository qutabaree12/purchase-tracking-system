import FormField from '../common/FormField'

export default function StockForm({ data, onChange, errors, productOptions }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <FormField label="Produit" name="product_id" type="select" value={data.product_id} onChange={onChange} required options={productOptions} error={errors?.product_id} />
      <FormField label="Quantité" name="quantity" type="number" value={data.quantity} onChange={onChange} required error={errors?.quantity} />
      <FormField label="Emplacement" name="location" type="text" value={data.location} onChange={onChange} error={errors?.location} />
      <FormField label="Motif" name="reason" type="textarea" value={data.reason} onChange={onChange} required error={errors?.reason} />
    </div>
  )
}
