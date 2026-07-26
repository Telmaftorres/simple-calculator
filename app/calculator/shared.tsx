import { cn } from '@/lib/utils'

const colorMap: Record<string, {
  border: string
  header: string
  title: string
  badge: string
  toggleOn: string
  toggleOff: string
}> = {
  emerald: {
    border: 'border-emerald-200',
    header: 'bg-emerald-50 border-b border-emerald-100',
    title: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
    toggleOn: 'bg-emerald-500',
    toggleOff: 'bg-slate-300',
  },
  blue: {
    border: 'border-blue-200',
    header: 'bg-blue-50 border-b border-blue-100',
    title: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-700',
    toggleOn: 'bg-blue-500',
    toggleOff: 'bg-slate-300',
  },
  purple: {
    border: 'border-purple-200',
    header: 'bg-purple-50 border-b border-purple-100',
    title: 'text-purple-800',
    badge: 'bg-purple-100 text-purple-700',
    toggleOn: 'bg-purple-500',
    toggleOff: 'bg-slate-300',
  },
  orange: {
    border: 'border-orange-200',
    header: 'bg-orange-50 border-b border-orange-100',
    title: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-700',
    toggleOn: 'bg-orange-500',
    toggleOff: 'bg-slate-300',
  },
  pink: {
    border: 'border-pink-200',
    header: 'bg-pink-50 border-b border-pink-100',
    title: 'text-pink-800',
    badge: 'bg-pink-100 text-pink-700',
    toggleOn: 'bg-pink-500',
    toggleOff: 'bg-slate-300',
  },
  teal: {
    border: 'border-teal-200',
    header: 'bg-teal-50 border-b border-teal-100',
    title: 'text-teal-800',
    badge: 'bg-teal-100 text-teal-700',
    toggleOn: 'bg-teal-500',
    toggleOff: 'bg-slate-300',
  },
  amber: {
    border: 'border-amber-200',
    header: 'bg-amber-50 border-b border-amber-100',
    title: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
    toggleOn: 'bg-amber-500',
    toggleOff: 'bg-slate-300',
  },
}

interface SectionDisplayProps {
  number: string
  title: string
  color: string
  children: React.ReactNode
  // ✅ Props optionnelles pour le toggle ON/OFF
  enabled?: boolean
  onToggle?: (v: boolean) => void
  // ✅ Boutons sous le header
  headerButtons?: React.ReactNode
  // ✅ Bouton à côté du titre (dans le header)
  titleButton?: React.ReactNode
}

export function SectionDisplay({
  number,
  title,
  color,
  children,
  enabled,
  onToggle,
  headerButtons,
  titleButton,
}: SectionDisplayProps) {
  const colors = colorMap[color] || colorMap.blue
  const hasToggle = enabled !== undefined && onToggle !== undefined

  return (
    <div className={`rounded-xl border ${colors.border} overflow-hidden shadow-sm`}>
      {/* Header */}
      <div
        className={`${colors.header} px-5 py-3 flex items-center justify-between ${hasToggle ? 'cursor-pointer select-none' : ''}`}
        onClick={hasToggle ? () => onToggle!(!enabled) : undefined}
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
            {number}
          </span>
          <h3 className={`font-semibold text-sm ${colors.title}`}>{title}</h3>
          {titleButton}
        </div>

        {/* ✅ Toggle ON/OFF — visuel uniquement, le clic est sur tout le header */}
        {hasToggle && (
          <div
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
              ${enabled ? colors.toggleOn : colors.toggleOff}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200
                ${enabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </div>
        )}
      </div>

      {/* ✅ Boutons sous le header */}
      {headerButtons && (
        <div className="px-5 pt-3 flex items-center gap-2 flex-wrap">
          {headerButtons}
        </div>
      )}

      {/* Contenu — masqué si toggle OFF */}
      {(!hasToggle || enabled) && (
        <div className="p-5">
          {children}
        </div>
      )}
    </div>
  )
}

// ── CostRow ──
interface CostRowProps {
  label: string
  value: number
  details?: string
}

export function CostRow({ label, value, details }: CostRowProps) {
  return (
    <div className="flex justify-between items-start text-sm">
      <div className="flex-1 min-w-0">
        <span className="text-slate-600">{label}</span>
        {details && <p className="text-xs text-slate-400 mt-0.5">{details}</p>}
      </div>
      <span className="font-semibold text-slate-800 ml-4 shrink-0">
        {value.toFixed(2)} €
      </span>
    </div>
  )
}
