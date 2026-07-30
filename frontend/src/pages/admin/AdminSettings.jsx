export default function AdminSettings() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
      <div className="card">
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="label">Nom de l'entreprise</label>
              <input className="input" defaultValue="Algérie Telecom" disabled />
            </div>
            <div>
              <label className="label">Devise</label>
              <input className="input" defaultValue="DZD" disabled />
            </div>
            <div>
              <label className="label">Seuil d'alerte stock</label>
              <input className="input" type="number" defaultValue={5} />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button className="btn-primary">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  )
}
