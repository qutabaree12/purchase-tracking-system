import FormField from '../common/FormField'

export default function SupplierForm({ data, onChange, errors }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Nom du fournisseur" name="name" value={data.name} onChange={onChange} required error={errors?.name} />
      <FormField label="Personne à contacter" name="contact_person" value={data.contact_person} onChange={onChange} error={errors?.contact_person} />
      <FormField label="Email" name="email" type="email" value={data.email} onChange={onChange} required error={errors?.email} />
      <FormField label="Téléphone" name="phone" type="text" value={data.phone} onChange={onChange} required error={errors?.phone} />
      <FormField label="Adresse" name="address" type="textarea" value={data.address} onChange={onChange} error={errors?.address} />
      <FormField label="Ville" name="city" type="text" value={data.city} onChange={onChange} error={errors?.city} />
      <FormField label="Pays" name="country" type="text" value={data.country} onChange={onChange} error={errors?.country} />
      <FormField label="N° Fiscal" name="tax_id" type="text" value={data.tax_id} onChange={onChange} error={errors?.tax_id} />
      <FormField label="N° d'enregistrement" name="registration_number" type="text" value={data.registration_number} onChange={onChange} error={errors?.registration_number} />
    </div>
  )
}
