import FormField from '../common/FormField'

const roleOptions = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'manager', label: 'Responsable' },
  { value: 'procurement_officer', label: 'Agent d\'achat' },
  { value: 'warehouse_keeper', label: 'Magasinier' },
]

export default function UserForm({ data, onChange, errors, editMode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Nom complet" name="full_name" value={data.full_name} onChange={onChange} required error={errors?.full_name} />
      <FormField label="Nom d'utilisateur" name="username" value={data.username} onChange={onChange} required error={errors?.username} />
      <FormField label="Email" name="email" type="email" value={data.email} onChange={onChange} required error={errors?.email} />
      {!editMode && (
        <FormField label="Mot de passe" name="password" type="password" value={data.password || ''} onChange={onChange} required error={errors?.password} />
      )}
      <FormField label="Rôle" name="role" type="select" value={data.role} onChange={onChange} required options={roleOptions} error={errors?.role} />
      <FormField label="Téléphone" name="phone" type="text" value={data.phone} onChange={onChange} error={errors?.phone} />
      <FormField label="Département" name="department" type="text" value={data.department} onChange={onChange} error={errors?.department} />
    </div>
  )
}
