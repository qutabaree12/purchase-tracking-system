import FormField from '../common/FormField'

const statusOptions = [
  { value: 'pending', label: 'En attente' },
  { value: 'partial', label: 'Payée partiellement' },
  { value: 'paid', label: 'Payée' },
  { value: 'overdue', label: 'En retard' },
  { value: 'cancelled', label: 'Annulée' },
]

export default function InvoiceForm({ data, onChange, errors, purchaseOrderOptions }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Numéro de facture" name="invoice_number" value={data.invoice_number} onChange={onChange} required error={errors?.invoice_number} />
      <FormField label="Bon de commande" name="purchase_order_id" type="select" value={data.purchase_order_id} onChange={onChange} required options={purchaseOrderOptions} error={errors?.purchase_order_id} />
      <FormField label="Date de facture" name="invoice_date" type="date" value={data.invoice_date} onChange={onChange} required error={errors?.invoice_date} />
      <FormField label="Date d'échéance" name="due_date" type="date" value={data.due_date} onChange={onChange} required error={errors?.due_date} />
      <FormField label="Montant (DZD)" name="amount" type="number" value={data.amount} onChange={onChange} required min={0} step="0.01" error={errors?.amount} />
      <FormField label="Montant payé (DZD)" name="paid_amount" type="number" value={data.paid_amount} onChange={onChange} min={0} step="0.01" error={errors?.paid_amount} />
      <FormField label="Statut" name="status" type="select" value={data.status} onChange={onChange} options={statusOptions} error={errors?.status} />
      <FormField label="Date de paiement" name="paid_date" type="date" value={data.paid_date} onChange={onChange} error={errors?.paid_date} />
      <div className="md:col-span-2">
        <FormField label="Notes" name="notes" type="textarea" value={data.notes} onChange={onChange} error={errors?.notes} />
      </div>
    </div>
  )
}
