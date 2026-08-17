import FormField from '../common/FormField'


const unitOptions = [
  { value: 'unité', label: 'Unité' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'g', label: 'Gramme' },
  { value: 'l', label: 'Litre' },
  { value: 'ml', label: 'Millilitre' },
  { value: 'm', label: 'Mètre' },
  { value: 'm²', label: 'Mètre carré' },
  { value: 'boîte', label: 'Boîte' },
  { value: 'carton', label: 'Carton' },
  { value: 'palette', label: 'Palette' },
]

export default function ProductForm({ data, onChange, errors, supplierOptions }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Nom du produit" name="name" value={data.name} onChange={onChange} required error={errors?.name} />
      <FormField label="Référence" name="reference" type="text" value={data.reference} onChange={onChange} error={errors?.reference} />
      <FormField label="Unité" name="unit" type="select" value={data.unit} onChange={onChange} required options={unitOptions} error={errors?.unit} />
      <FormField label="Prix unitaire (DZD)" name="unit_price" type="number" value={data.unit_price} onChange={onChange} required min={0} step="0.01" error={errors?.unit_price} />
      <FormField label="Fournisseur" name="supplier_id" type="select" value={data.supplier_id} onChange={onChange} required options={supplierOptions} error={errors?.supplier_id} />
      <FormField label="Stock initial" name="stock_quantity" type="number" value={data.stock_quantity} onChange={onChange} required min={0} error={errors?.stock_quantity} />
      <FormField label="Seuil minimum" name="min_stock_level" type="number" value={data.min_stock_level} onChange={onChange} required min={0} error={errors?.min_stock_level} />
      <FormField label="Seuil maximum" name="max_stock_level" type="number" value={data.max_stock_level} onChange={onChange} required min={0} error={errors?.max_stock_level} />
      <div className="md:col-span-2">
        <FormField label="Description" name="description" type="textarea" value={data.description} onChange={onChange} error={errors?.description} />
      </div>
    </div>
  )
}
