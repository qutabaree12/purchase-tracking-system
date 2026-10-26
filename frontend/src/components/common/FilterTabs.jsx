export default function FilterTabs({ tabs, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-6 border-b border-gray-200 dark:border-white/10">
      {tabs.map((t) => {
        const actif = value === t.filter
        return (
          <button
            key={t.filter}
            type="button"
            onClick={() => onChange(t.filter)}
            className={`-mb-px pb-2 text-sm font-medium border-b-2 transition-colors ${
              actif
                ? 'border-[#007a33] text-[#007a33] dark:border-[#00a651] dark:text-[#00a651]'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-70">{t.value}</span>
          </button>
        )
      })}
    </div>
  )
}
