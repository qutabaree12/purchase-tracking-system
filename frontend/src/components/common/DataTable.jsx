import { useState } from 'react'

export default function DataTable({
  columns,
  data = [],
  loading,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}) {
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0

    const aVal = a[sortKey]
    const bVal = b[sortKey]

    if (aVal < bVal) {
      return sortDir === 'asc' ? -1 : 1
    }

    if (aVal > bVal) {
      return sortDir === 'asc' ? 1 : -1
    }

    return 0
  })

  const hasActions =
    onEdit ||
    onDelete ||
    onApprove ||
    onReject

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-8 text-gray-500">
          Chargement...
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          {/* =========================
              HEADER
          ========================= */}

          <thead>

            <tr className="bg-gray-50 border-b border-gray-200">

              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left font-medium text-gray-600 ${
                    column.sortable
                      ? 'cursor-pointer hover:text-gray-900 select-none'
                      : ''
                  }`}
                  onClick={() =>
                    column.sortable &&
                    handleSort(column.key)
                  }
                >

                  <span className="inline-flex items-center gap-1">

                    {column.header}

                    {column.sortable &&
                      sortKey === column.key && (
                        <span>
                          {sortDir === 'asc' ? '↑' : '↓'}
                        </span>
                      )}

                  </span>

                </th>
              ))}

              {hasActions && (
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Actions
                </th>
              )}

            </tr>

          </thead>

          {/* =========================
              BODY
          ========================= */}

          <tbody className="divide-y divide-gray-100">

            {sorted.length === 0 ? (

              <tr>

                <td
                  colSpan={
                    columns.length +
                    (hasActions ? 1 : 0)
                  }
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Aucune demande trouvée.
                </td>

              </tr>

            ) : (

              sorted.map((item) => (

                <tr
                  key={item.id_da || item.id}
                  className="hover:bg-gray-50 transition-colors"
                >

                  {/* Colonnes */}

                  {columns.map((column) => (

                    <td
                      key={column.key}
                      className="px-4 py-3 text-gray-700"
                    >
                      {column.render
                        ? column.render(item)
                        : item[column.key]}
                    </td>

                  ))}

                  {/* =========================
                      ACTIONS
                  ========================= */}

                  {hasActions && (

                    <td className="px-4 py-3">

                      <div className="flex items-center gap-3">

                        {/* Consulter */}

                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="text-brand-navy hover:text-blue-700 text-sm font-medium"
                          >
                            Consulter
                          </button>
                        )}

                        {/* Approuver */}

                        {onApprove &&
                          item.statut === 'en_cours' && (
                            <button
                              onClick={() => onApprove(item)}
                              className="text-green-700 hover:text-green-900 text-sm font-medium"
                            >
                              Approuver
                            </button>
                          )}

                        {/* Refuser */}

                        {onReject &&
                          item.statut === 'en_cours' && (
                            <button
                              onClick={() => onReject(item)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Refuser
                            </button>
                          )}

                        {/* Supprimer */}

                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Supprimer
                          </button>
                        )}

                      </div>

                    </td>

                  )}

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  )
}