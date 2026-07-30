import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PurchaseOrderForm from '../../components/forms/PurchaseOrderForm'

const supplierOptions = [
  { value: 1, label: 'Fournisseur A' },
  { value: 2, label: 'Fournisseur B' },
]

const productOptions = [
  { value: 1, label: 'Ordinateur Portable' },
  { value: 2, label: 'Imprimante Laser' },
]

export default function PurchaseOrder() {
  const navigate = useNavigate()
  const [data, setData] = useState({
    supplier_id: 0, expected_delivery_date: '', status: 'en cours',
    notes: '', items: [],
  })

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleItemChange = (index, field, value) => {
    setData((prev) => {
      const items = [...prev.items]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, items }
    })
  }

  const handleAddItem = () => {
    setData((prev) => ({
      ...prev,
      items: [...prev.items, { product_id: 0, quantity: 1, unit_price: 0 }],
    }))
  }

  const handleRemoveItem = (index) => {
    setData((prev) => ({
      ...prev, items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Save purchase order:', data)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Bon de commande</h1>
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-4">
          <PurchaseOrderForm
            data={data}
            onChange={handleChange}
            onItemChange={handleItemChange}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            supplierOptions={supplierOptions}
            productOptions={productOptions}
          />
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => navigate('/purchases/orders')} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer</button>
          </div>
        </div>
      </form>
    </div>
  )
}
