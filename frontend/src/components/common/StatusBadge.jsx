import { statusLabels } from '../../utils/format'

export default function StatusBadge({ status }) {
  const config = statusLabels[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
