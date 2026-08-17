import { Fragment } from 'react'

const GREEN = '#007a33'
const NAVY = '#1d2d62'
const GRAY = '#cbd5e1'

const STEPS = [
  { label: 'Créée', sub: 'Demandeur' },
  { label: 'Assignée', sub: 'Chef département' },
  { label: 'Validée', sub: 'Acheteur' },
  { label: 'Bon de commande', sub: 'Acheteur' },
  { label: 'Livrée', sub: 'Réception' },
]

export default function Stepper({ demande, compact = false }) {
  const { statut, id_acheteur, has_bc } = demande || {}

  // "current" = étape sur laquelle on attend une action (done = current - 1)
  let current = 1
  let rejected = false
  if (statut === 'refusee') {
    current = 3
    rejected = true
  } else if (statut === 'livree') {
    current = 6
  } else if (statut === 'approuvee') {
    current = has_bc ? 5 : 4
  } else if (statut === 'en_cours') {
    current = id_acheteur ? 3 : 2
  }

  const circle = compact ? 'w-6 h-6' : 'w-11 h-11'
  const numSize = compact ? 'text-[10px]' : 'text-sm'
  const connector = compact ? 'w-3' : 'flex-1 max-w-24'
  const stepWidth = compact ? 'w-6' : 'w-24'

  return (
    <div className="flex items-center justify-center">
      {STEPS.map((step, i) => {
        const num = i + 1
        const isDone = !rejected && num < current
        const isCurrent = num === current
        const isRejected = rejected && num === current
        const connectorDone = !rejected && num <= current

        return (
          <Fragment key={step.label}>
            {i > 0 && (
              <div
                className={`${connector} h-1.5 rounded-full`}
                style={{ backgroundColor: connectorDone ? GREEN : GRAY }}
              />
            )}
            <div className={`flex flex-col items-center ${stepWidth}`}>
              <div
                className={`${circle} rounded-full flex items-center justify-center ${numSize} font-bold border-2 ${
                  isCurrent ? 'shadow-md' : ''
                }`}
                style={{
                  backgroundColor: isDone
                    ? GREEN
                    : isCurrent
                      ? '#ffffff'
                      : isRejected
                        ? '#dc3545'
                        : GRAY,
                  borderColor: isCurrent ? GREEN : isRejected ? '#dc3545' : 'transparent',
                  color: isDone || isRejected ? '#ffffff' : isCurrent ? GREEN : '#ffffff',
                }}
              >
                {isRejected ? '✕' : num}
              </div>
              {!compact && (
                <>
                  <span
                    className={`mt-2 text-xs font-semibold text-center ${
                      isCurrent ? '' : isDone ? '' : 'text-gray-400'
                    }`}
                    style={isCurrent ? { color: NAVY } : isDone ? { color: GREEN } : undefined}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] text-gray-400 text-center">{step.sub}</span>
                </>
              )}
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}
