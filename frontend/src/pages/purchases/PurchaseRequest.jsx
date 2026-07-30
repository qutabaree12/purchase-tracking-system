import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormField from '../../components/common/FormField'

export default function PurchaseRequest() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', quantity: 0, unit: 'unité', estimated_budget: 0,
  })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Submit request:', form)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Nouvelle demande d'achat</h1>
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-4">
          <FormField label="Titre" name="title" value={form.title} onChange={handleChange} required />
          <FormField label="Description" name="description" type="textarea" value={form.description} onChange={handleChange} required />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quantité" name="quantity" type="number" value={form.quantity} onChange={handleChange} required min={1} />
            <FormField label="Unité" name="unit" value={form.unit} onChange={handleChange} required />
          </div>
          <FormField label="Budget estimé (DZD)" name="estimated_budget" type="number" value={form.estimated_budget} onChange={handleChange} min={0} />
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => navigate('/purchases/requests')} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">Soumettre la demande</button>
          </div>
        </div>
      </form>
    </div>
  )
}
