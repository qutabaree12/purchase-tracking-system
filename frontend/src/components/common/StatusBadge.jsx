import { statusLabels } from '../../utils/format'

export default function StatusBadge({ status }) {
  const config = statusLabels[status] || { label: status, color: 'bg-gray-500/10 text-gray-700 ring-1 ring-gray-400/30 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:ring-white/15' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
