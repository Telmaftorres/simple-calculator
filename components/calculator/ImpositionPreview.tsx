import type { Rect } from '@/lib/calculation/imposition'

interface Props {
  plateWidth: number
  plateHeight: number
  layout: Rect[]
  plateBorderMm?: number
  /** Poses réellement retenues (saisie manuelle) si différent du calcul auto */
  itemsPerPlate?: number
  color?: 'blue' | 'amber'
  title?: string
}

const COLORS = {
  blue: { fill: '#3b82f6', stroke: '#1d4ed8', text: 'text-blue-700' },
  amber: { fill: '#f59e0b', stroke: '#b45309', text: 'text-amber-700' },
}

/**
 * Plan de la plaque : chaque pose calculée par l'imposition est dessinée à l'échelle,
 * avec la marge de bord (zone hachurée) et le taux de remplissage de la plaque.
 */
export function ImpositionPreview({
  plateWidth, plateHeight, layout, plateBorderMm = 0, itemsPerPlate, color = 'blue', title = 'Plan de la plaque',
}: Props) {
  if (!plateWidth || !plateHeight || layout.length === 0) return null

  const c = COLORS[color]
  const shown = itemsPerPlate && itemsPerPlate > 0 ? Math.min(itemsPerPlate, layout.length) : layout.length
  const poses = layout.slice(0, shown)
  const usedArea = poses.reduce((sum, r) => sum + r.width * r.height, 0)
  const fillPct = Math.round((usedArea / (plateWidth * plateHeight)) * 100)
  const first = layout[0]
  const manual = itemsPerPlate != null && itemsPerPlate > 0 && itemsPerPlate !== layout.length
  // Trait fin quelle que soit la taille de la plaque
  const sw = Math.max(plateWidth, plateHeight) / 400

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-slate-500 uppercase tracking-wide">{title}</span>
        <span className="text-slate-500">
          Remplissage <span className={`font-semibold ${c.text}`}>{fillPct}%</span> · chute {100 - fillPct}%
        </span>
      </div>
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
        <svg
          viewBox={`${-sw} ${-sw} ${plateWidth + 2 * sw} ${plateHeight + 2 * sw}`}
          className="w-full h-auto max-h-64"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id={`hatch-${color}`} width={sw * 8} height={sw * 8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2={sw * 8} stroke="#cbd5e1" strokeWidth={sw} />
            </pattern>
          </defs>
          {/* Plaque + marge de bord hachurée */}
          <rect x={0} y={0} width={plateWidth} height={plateHeight} fill={`url(#hatch-${color})`} stroke="#64748b" strokeWidth={sw * 1.5} />
          <rect
            x={plateBorderMm} y={plateBorderMm}
            width={Math.max(0, plateWidth - 2 * plateBorderMm)} height={Math.max(0, plateHeight - 2 * plateBorderMm)}
            fill="white"
          />
          {/* Poses */}
          {poses.map((r, i) => (
            <rect
              key={i}
              x={r.x + plateBorderMm} y={r.y + plateBorderMm}
              width={r.width} height={r.height}
              fill={c.fill} fillOpacity={r.rotated ? 0.45 : 0.3}
              stroke={c.stroke} strokeWidth={sw}
            />
          ))}
        </svg>
        <div className="flex flex-wrap justify-between gap-x-3 text-[10px] text-slate-500 mt-1.5">
          <span>Plaque {plateWidth} × {plateHeight} mm{plateBorderMm > 0 ? ` · bord ${plateBorderMm} mm` : ''}</span>
          <span>Pose {first.width} × {first.height} mm</span>
        </div>
        {manual && (
          <div className="text-[10px] text-amber-600 mt-1">
            Poses saisies à la main ({itemsPerPlate}) : le plan montre {shown} pose{shown > 1 ? 's' : ''} sur {layout.length} possibles.
          </div>
        )}
      </div>
    </div>
  )
}
