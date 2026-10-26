import useCountUp from '../../hooks/useCountUp'

// Classes complètes (Tailwind ne détecte pas les noms construits dynamiquement)
const TONES = {
  blue: {
    card: 'from-blue-500/15 to-blue-500/[0.03] ring-blue-500/25 text-blue-700 dark:from-blue-500/20 dark:to-blue-500/5 dark:ring-blue-400/25 dark:text-blue-300',
    icon: 'bg-blue-500/15 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300',
  },
  sky: {
    card: 'from-sky-500/15 to-sky-500/[0.03] ring-sky-500/25 text-sky-700 dark:from-sky-500/20 dark:to-sky-500/5 dark:ring-sky-400/25 dark:text-sky-300',
    icon: 'bg-sky-500/15 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300',
  },
  emerald: {
    card: 'from-emerald-500/15 to-emerald-500/[0.03] ring-emerald-500/25 text-emerald-700 dark:from-emerald-500/20 dark:to-emerald-500/5 dark:ring-emerald-400/25 dark:text-emerald-300',
    icon: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300',
  },
  rose: {
    card: 'from-rose-500/15 to-rose-500/[0.03] ring-rose-500/25 text-rose-700 dark:from-rose-500/20 dark:to-rose-500/5 dark:ring-rose-400/25 dark:text-rose-300',
    icon: 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300',
  },
  amber: {
    card: 'from-amber-500/15 to-amber-500/[0.03] ring-amber-500/25 text-amber-700 dark:from-amber-500/20 dark:to-amber-500/5 dark:ring-amber-400/25 dark:text-amber-300',
    icon: 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
  },
  violet: {
    card: 'from-violet-500/15 to-violet-500/[0.03] ring-violet-500/25 text-violet-700 dark:from-violet-500/20 dark:to-violet-500/5 dark:ring-violet-400/25 dark:text-violet-300',
    icon: 'bg-violet-500/15 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300',
  },
}

const ICONS = {
  file: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>),
  clock: (<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>),
  check: (<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>),
  x: (<><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>),
  trend: (<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>),
  box: (<><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><polyline points="3.3 8.3 12 13 20.7 8.3" /><line x1="12" y1="13" x2="12" y2="21" /></>),
}

export function Icon({ name, className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      {ICONS[name] || ICONS.file}
    </svg>
  )
}

export default function StatCard({ label, value, suffix = '', decimals = 0, icon = 'file', tone = 'blue', hint, onClick, active = false, delay = 0 }) {
  const t = TONES[tone] || TONES.blue
  const animated = useCountUp(value ?? 0)
  const shown = value == null ? '—' : `${animated.toFixed(decimals).replace('.', ',')}${suffix}`

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? handleKey : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-fade-up group relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br ring-1 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${t.card} ${onClick ? 'cursor-pointer' : ''} ${active ? 'ring-2' : ''}`}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-current opacity-[0.06] transition-transform duration-500 group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wide opacity-75">{label}</p>
          <p className="text-3xl font-bold mt-2 tabular-nums">{shown}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${t.icon}`}>
          <Icon name={icon} />
        </span>
      </div>
      {hint && <p className="relative mt-3 text-xs opacity-70">{hint}</p>}
    </div>
  )
}
