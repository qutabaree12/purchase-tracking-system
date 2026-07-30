import FormField from '../common/FormField'

export default function CategoryForm({ data, onChange, errors }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <FormField label="Nom de la catégorie" name="name" value={data.name} onChange={onChange} required error={errors?.name} />
      <FormField label="Description" name="description" type="textarea" value={data.description} onChange={onChange} error={errors?.description} />
    </div>
  )
}
