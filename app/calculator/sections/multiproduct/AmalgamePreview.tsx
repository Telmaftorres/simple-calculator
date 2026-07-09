'use client'

import type { MultiImpositionStrip } from '@/lib/calculation/amalgame-multi-imposition'

// Palette par produit (index de la bande)
const PALETTE = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1']

interface Props {
  plateWidth: number
  plateHeight: number
  strips: MultiImpositionStrip[]
  utilization?: number
}

/**
 * Aperçu visuel de l'amalgame proposé : un mini-plan de la plaque où chaque
 * produit occupe une bande, remplie d'une grille cols × rows de poses colorées.
 */
export function AmalgamePreview({ plateWidth, plateHeight, strips, utilization }: Props) {
  if (!plateWidth || !plateHeight || strips.length === 0) return null

  const MAXW = 220
  const scale = MAXW / plateWidth
  const w = plateWidth * scale
  const h = plateHeight * scale
  const gap = 1 // px entre poses

  const rects: { x: number; y: number; w: number; h: number; color: string }[] = []
  let yAcc = 0
  for (const s of strips) {
    const stripH = s.stripHeightMm * scale
    const color = PALETTE[s.productIndex % PALETTE.length]
    const cols = Math.max(1, s.cols)
    const rows = Math.max(1, s.rows)
    const cellW = (w - gap * (cols + 1)) / cols
    const cellH = (stripH - gap * (rows + 1)) / rows
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rects.push({
          x: gap + c * (cellW + gap),
          y: yAcc + gap + r * (cellH + gap),
          w: Math.max(0, cellW),
          h: Math.max(0, cellH),
          color,
        })
      }
    }
    yAcc += stripH
  }

  return (
    <div className="px-4 py-3 border-t bg-slate-50/60 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Aperçu de l&apos;amalgame</span>
        {utilization != null && (
          <span className="text-[11px] font-medium text-slate-500">Remplissage {Math.round(utilization * 100)}%</span>
        )}
      </div>
      <div className="flex gap-3 items-start flex-wrap">
        <svg width={w} height={h} className="border border-slate-300 rounded bg-white shrink-0">
          {rects.map((rc, i) => (
            <rect key={i} x={rc.x} y={rc.y} width={rc.w} height={rc.h} rx={1} fill={rc.color} fillOpacity={0.85} />
          ))}
        </svg>
        <div className="flex flex-col gap-1 text-[11px] min-w-0">
          {strips.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: PALETTE[s.productIndex % PALETTE.length] }} />
              <span className="text-slate-600 truncate">{s.productName || `P${s.productIndex + 1}`}</span>
              <span className="text-slate-400 whitespace-nowrap">· {s.posesPerPlate} pose{s.posesPerPlate > 1 ? 's' : ''}{s.rotated ? ' ↻' : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
