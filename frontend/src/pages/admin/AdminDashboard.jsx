export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Demandes d\'achat', value: '0', color: 'bg-blue-500' },
          { label: 'Bons de commande', value: '0', color: 'bg-indigo-500' },
          { label: 'En attente', value: '0', color: 'bg-yellow-500' },
          { label: 'Utilisateurs', value: '0', color: 'bg-green-500' },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <div className="card-body">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-white text-lg font-bold`}>{stat.value}</div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header"><h2 className="font-semibold">Dernières demandes</h2></div>
          <div className="card-body"><p className="text-sm text-gray-400 italic">Aucune demande</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h2 className="font-semibold">Derniers bons de commande</h2></div>
          <div className="card-body"><p className="text-sm text-gray-400 italic">Aucun bon</p></div>
        </div>
      </div>
    </div>
  )
}
