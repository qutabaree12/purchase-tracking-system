import FormField from '../common/FormField'

export default function RejectionLetterForm({
  data,
  onChange,
  errors,
}) {
  return (
    <div className="space-y-4">

      <FormField
        label="Motif du rejet"
        name="motif"
        type="textarea"
        value={data.motif}
        onChange={onChange}
        required
        error={errors?.motif}
        placeholder="Veuillez indiquer le motif du rejet..."
      />

    </div>
  )
}