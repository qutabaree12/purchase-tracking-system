import { useState, useRef, useEffect } from 'react'

export default function Select({
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Sélectionner...',
  disabled = false,
  error = false,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const selected = options.find((o) => String(o.value) === String(value))
  const label = selected ? selected.label : placeholder

  const handleSelect = (optValue) => {
    setOpen(false)
    if (onChange) onChange({ target: { name, value: optValue } })
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          'w-full flex items-center justify-between gap-2 px-4 py-3 text-sm bg-white rounded-xl border text-left transition-all duration-200',
          'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500',
          'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007a33]/15',
          error
            ? 'border-red-500 focus-visible:ring-red-500/15'
            : open
              ? 'border-[#007a33] ring-4 ring-[#007a33]/10'
              : 'border-[#d6dbe3] hover:border-[#b8c2cc]',
          'dark:bg-[#15224a] dark:border-[#334155] dark:hover:border-[#475569] dark:disabled:bg-[#15224a]',
          open ? 'dark:border-[#00a651] dark:ring-[#00a651]/20' : '',
        ].join(' ')}
      >
        <span
          className={`truncate ${
            selected ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {label}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200 ease-out ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="select-menu absolute z-50 mt-1 w-full max-h-80 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl py-1 dark:bg-[#101a38] dark:border-[#1e293b]"
        >
          {options.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">Aucune option</li>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value)
              return (
                <li key={String(opt.value)} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-2 text-left px-4 py-3 text-sm transition-colors ${
                      isSelected
                        ? 'bg-[#007a33]/10 text-[#007a33] font-medium dark:bg-[#00a651]/15 dark:text-[#86efac]'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-[#15224a]'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
