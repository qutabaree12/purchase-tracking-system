import FormField from '../common/FormField'

export default function RejectionLetterForm({
    data,
    onChange,
    errors,
  }){
  return (
          <FormField
            label="Motif"
            name="motif"
            type="textarea"
            value={data.motif}
            onChange={onChange}
            required
            error={errors?.motif}
            placeholder="Expliquez pourquoi la demande est refusée..."
          />
  );
}