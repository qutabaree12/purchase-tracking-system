import FormField from "../common/FormField";

const DOT_VALUES = [
  "Direction Générale — Alger",
  "DOT Alger",
  "DOT Oran",
  "DOT Constantine",
  "DOT Annaba",
  "DOT Blida",
  "DOT Sétif",
  "DOT Tlemcen",
  "DOT Béjaïa",
  "DOT Ouargla",
  "DOT Ghardaïa",
];

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
  const dotOptions = [
    ...(data.dot && !DOT_VALUES.includes(data.dot)
      ? [{ value: data.dot, label: data.dot }]
      : []),
    ...DOT_VALUES.map((value) => ({ value, label: value })),
  ];

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <FormField
          label="DOT"
          name="dot"
          type="select"
          value={data.dot}
          onChange={onChange}
          options={dotOptions}
          placeholder="Sélectionner une DOT..."
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