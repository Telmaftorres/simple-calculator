import { VARNISH_TYPE_LABELS, type VarnishType } from '@/lib/calculation/printing-time'

export type PrintInfo = {
  varnish: string | null        // ex. « Gloss · 100 % »
  white: string | null          // ex. « 100 % »
  platesPerTray: number | null
  perPlateMin: number | null    // temps d'impression par plaque (min), une face
}

// Infos impression (formule atelier) à afficher sur la fiche de prod et le devis interne.
export function buildPrintInfo(p: {
  hasVarnish: boolean
  varnishType?: string | null
  varnishSurfacePercent?: number | null
  hasFlatColor: boolean
  flatColorSurfacePercent?: number | null
  platesPerTray?: number | null
  totalMachineTimeMin?: number | null
  platesCount?: number | null
  isRectoVerso?: boolean
}): PrintInfo {
  const typeLabel = p.varnishType ? VARNISH_TYPE_LABELS[p.varnishType as VarnishType] ?? null : null
  const varnishPct = p.varnishSurfacePercent ? `${Math.round(p.varnishSurfacePercent)} %` : null
  const varnish = p.hasVarnish
    ? [typeLabel ?? 'Type non précisé', varnishPct].filter(Boolean).join(' · ')
    : null
  const white = p.hasFlatColor
    ? (p.flatColorSurfacePercent ? `${Math.round(p.flatColorSurfacePercent)} %` : 'Oui')
    : null
  const passes = p.isRectoVerso ? 2 : 1
  const perPlateMin = p.totalMachineTimeMin != null && p.totalMachineTimeMin > 0 && p.platesCount && p.platesCount > 0
    ? p.totalMachineTimeMin / (p.platesCount * passes)
    : null
  return { varnish, white, platesPerTray: p.platesPerTray ?? null, perPlateMin }
}
