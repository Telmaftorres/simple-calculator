import {
  PRINT_FIXED_TIME_SEC, PRINT_X_SEC_PER_MM, PRINT_Y_SEC_PER_MM, PRINT_TRAY_GAP_MM,
  PRINT_MODE_COEF_PRODUCTION, PRINT_MODE_COEF_QUALITY, PRINT_COEF_WHITE,
  PRINT_COEF_VARNISH_GLOSS, PRINT_COEF_VARNISH_SEMI_GLOSS, PRINT_COEF_VARNISH_MATTE,
} from '@/lib/config/pricing'

export type VarnishType = 'gloss' | 'semi_gloss' | 'matte'

export const VARNISH_TYPE_LABELS: Record<VarnishType, string> = {
  gloss: 'Gloss',
  semi_gloss: 'Semi gloss',
  matte: 'Matte',
}

export interface PrintingTimeInput {
  plateWidthMm: number
  plateHeightMm: number
  platesCount: number
  printMode: string
  isRectoVerso: boolean
  hasVarnish: boolean
  hasFlatColor: boolean
  varnishType?: string | null
  varnishSurfacePercent?: number
  flatColorSurfacePercent?: number
  platesPerTray?: number | null
  settings?: Record<string, number>
}

export interface PrintingTimeBreakdown {
  platesPerTray: number
  moveXSec: number
  moveYSec: number
  baseSec: number
  modeCoef: number
  whiteCoef: number
  varnishCoef: number
  multiplier: number
  fixedSec: number
  traySec: number
  perPlateMin: number
  passes: number
  totalMin: number
}

export function varnishCoefFor(type: string | null | undefined, settings?: Record<string, number>): number {
  if (type === 'semi_gloss') return settings?.PRINT_COEF_VARNISH_SEMI_GLOSS ?? PRINT_COEF_VARNISH_SEMI_GLOSS
  if (type === 'matte') return settings?.PRINT_COEF_VARNISH_MATTE ?? PRINT_COEF_VARNISH_MATTE
  if (type === 'gloss') return settings?.PRINT_COEF_VARNISH_GLOSS ?? PRINT_COEF_VARNISH_GLOSS
  // Pas de type choisi : le vernis n'ajoute pas de temps machine
  return 0
}

// Temps machine d'impression (formule atelier) :
//   plateau (s) = temps fixe + (X × n + écart × (n−1)) × vitesse X + Y × vitesse Y) × (mode + coef blanc × % + coef vernis × %)
//   par plaque (min) = plateau ÷ n ÷ 60 ; total = par plaque × nb plaques × passages (R/V)
// Partagé entre le calculateur et la fiche de production.
export function computePrintingTimeBreakdown(p: PrintingTimeInput): PrintingTimeBreakdown {
  const s = p.settings
  const n = Math.max(1, Math.floor(p.platesPerTray ?? 1))
  const kx = s?.PRINT_X_SEC_PER_MM ?? PRINT_X_SEC_PER_MM
  const ky = s?.PRINT_Y_SEC_PER_MM ?? PRINT_Y_SEC_PER_MM
  const gap = s?.PRINT_TRAY_GAP_MM ?? PRINT_TRAY_GAP_MM
  const fixedSec = s?.PRINT_FIXED_TIME_SEC ?? PRINT_FIXED_TIME_SEC

  const moveXSec = (p.plateWidthMm * n + gap * (n - 1)) * kx
  const moveYSec = p.plateHeightMm * ky
  const baseSec = moveXSec + moveYSec

  const modeCoef = p.printMode === 'quality'
    ? (s?.PRINT_MODE_COEF_QUALITY ?? PRINT_MODE_COEF_QUALITY)
    : (s?.PRINT_MODE_COEF_PRODUCTION ?? PRINT_MODE_COEF_PRODUCTION)
  const whiteCoef = p.hasFlatColor
    ? (s?.PRINT_COEF_WHITE ?? PRINT_COEF_WHITE) * ((p.flatColorSurfacePercent ?? 0) / 100)
    : 0
  const varnishCoef = p.hasVarnish
    ? varnishCoefFor(p.varnishType, s) * ((p.varnishSurfacePercent ?? 0) / 100)
    : 0
  const multiplier = modeCoef + whiteCoef + varnishCoef

  const traySec = fixedSec + baseSec * multiplier
  const perPlateMin = traySec / n / 60
  const passes = p.isRectoVerso ? 2 : 1
  const totalMin = perPlateMin * p.platesCount * passes

  return {
    platesPerTray: n, moveXSec, moveYSec, baseSec, modeCoef, whiteCoef, varnishCoef,
    multiplier, fixedSec, traySec, perPlateMin, passes, totalMin,
  }
}

export function computePrintingMachineTimeMin(p: PrintingTimeInput): number {
  if (p.plateWidthMm <= 0 || p.plateHeightMm <= 0 || p.platesCount <= 0) return 0
  return computePrintingTimeBreakdown(p).totalMin
}
