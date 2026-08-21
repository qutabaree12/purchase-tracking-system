import FormField from "../common/FormField";

const statusOptions = [
  {
    value: "en_cours",
    label: "En cours",
  },
  {
    value: "approuvee",
    label: "Approuvée",
  },
  {
    value: "refusee",
    label: "Refusée",
  },
];

export default function PurchaseRequestForm({
  data,
  onChange,
  errors,
}) {
  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <FormField
          label="DOT"
          name="dot"
          value={data.dot}
          onChange={onChange}
        />

        {/*<FormField
          label="Date de création"
          name="date_creation"
          type="date"
          value={data.date_creation}
          onChange={onChange}
          required
        />*/}

    
        <div className="md:col-span-2">
          <FormField
            label="Objet"
            name="objet"
            type="textarea"
            value={data.objet}
            onChange={onChange}
            required
          />
        </div>

      </div>

    </div>
  );
}