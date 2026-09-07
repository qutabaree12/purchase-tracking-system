import { useState } from 'react'

export default function DataTable({
  columns,
  data,
  loading,
  onEdit,
  onDelete,
  onReject,
  onAssign,
  onView,
  onRegroup,
  onPdf,
  actionsLabel = 'Actions',
  total,
  page,
  pageSize,
  onPageChange,
}) {
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState('asc')

  const totalPages = total != null && pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 0
  const start = total != null ? (page - 1) * pageSize + 1 : 0
  const end = total != null ? Math.min(page * pageSize, total) : 0

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0

    const aVal = a[sortKey]
    const bVal = b[sortKey]

    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1

    return 0
  })

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

          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">

              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left font-medium text-gray-600 ${
                    col.sortable
                      ? 'cursor-pointer hover:text-gray-900 select-none'
                      : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}

                    {col.sortable && sortKey === col.key && (
                      <span>{sortDir === 'asc' ? 'â†‘' : 'â†“'}</span>
                    )}

                  </span>
                </th>
              ))}

              {(onEdit || onDelete || onReject || onAssign || onView || onRegroup || onPdf) && (
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  {actionsLabel}
                </th>
              )}

            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">

            {sorted.length === 0 ? (

              <tr>
                <td
                  colSpan={
                    columns.length +
                    (onEdit || onDelete || onReject || onAssign || onView || onRegroup || onPdf ? 1 : 0)
                  }
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Aucune donnée trouvée
                </td>
              </tr>

            ) : (

              sorted.map((item) => (

                <tr
                  key={item.id ?? item.id_da}
                  className="hover:bg-gray-50 transition-colors"
                >

                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-gray-700"
                    >
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}

                  {(onEdit || onDelete || onReject || onAssign || onView || onRegroup || onPdf) && (

                    <td className="px-4 py-3">

                      <div className="flex items-center gap-3">

                        {onView && (
                          <button
                            onClick={() => onView(item)}
                            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                          >
                            Fiche
                          </button>
                        )}

                        {onRegroup && (
                          <button
                            onClick={() => onRegroup(item)}
                            className="text-green-700 hover:text-green-900 text-sm font-medium"
                          >
                            Regrouper
                          </button>
                        )}

                        {onPdf && (
                          <button
                            onClick={() => onPdf(item)}
                            className="text-blue-700 hover:text-blue-900 text-sm font-medium"
                          >
                            PDF
                          </button>
                        )}

                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                          >
                            Modifier
                          </button>
                        )}

                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Supprimer
                          </button>
                        )}

                        {onReject && (
                          <button
                            onClick={() => onReject(item)}
                            className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                          >
                            Refuser
                          </button>
                        )}

                        {onAssign && (
                          <button
                            onClick={() => onAssign(item)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {item.id_acheteur ? "Changer d'acheteur" : "Choisir un acheteur"}
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

      {total != null && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {start}–{end} sur {total}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Précédent
            </button>
            <span className="text-gray-500 dark:text-gray-400">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
