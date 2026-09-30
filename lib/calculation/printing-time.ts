import { PRINT_SPEED_PRODUCTION, PRINT_SPEED_QUALITY } from '@/lib/config/pricing'

// Temps machine d'impression (min) : surface plaque × cadence × passages (R/V) × nb plaques,
// + passes vernis / blanc. Partagé entre le calculateur et la fiche de production.
export function computePrintingMachineTimeMin(p: {
  plateWidthMm: number
  plateHeightMm: number
  platesCount: number
  printMode: string
  isRectoVerso: boolean
  hasVarnish: boolean
  hasFlatColor: boolean
  settings?: Record<string, number>
}): number {
  const plateAreaM2 = (p.plateWidthMm * p.plateHeightMm) / 1_000_000
  const multiplier = p.isRectoVerso ? 2 : 1
  const pace = p.printMode === 'production'
    ? (p.settings?.PRINT_SPEED_PRODUCTION ?? PRINT_SPEED_PRODUCTION)
    : (p.settings?.PRINT_SPEED_QUALITY ?? PRINT_SPEED_QUALITY)
  const base = plateAreaM2 * pace * multiplier * p.platesCount
  const varnish = p.hasVarnish ? plateAreaM2 * (p.settings?.PRINT_SPEED_VARNISH ?? 1.5) * multiplier * p.platesCount : 0
  const flatColor = p.hasFlatColor ? plateAreaM2 * (p.settings?.PRINT_SPEED_FLAT_COLOR ?? 1.5) * multiplier * p.platesCount : 0
  return base + varnish + flatColor
}
