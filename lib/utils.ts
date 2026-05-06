import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Évalue une formule de mise à plat avec les variables l (largeur), L (profondeur/longueur), H (hauteur).
 * Retourne null si la formule est invalide ou le résultat non numérique.
 */
export function evalFormula(formula: string, l: number, L: number, H: number): number | null {
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function('l', 'L', 'H', `return (${formula})`)(l, L, H)
    return typeof result === 'number' && isFinite(result) && result > 0 ? Math.round(result) : null
  } catch {
    return null
  }
}

export function resolveFlatFormula(formula: string | undefined, axis: 'width' | 'height', formatType: '2d' | '3d') {
  const normalized = formula?.trim()
  if (normalized) {
    if (formatType === '3d' && axis === 'width' && normalized === 'l') return '2 * l + 2 * L + 70'
    if (formatType === '3d' && axis === 'height' && normalized === 'L') return 'H'
    return normalized
  }
  if (formatType !== '3d') return axis === 'width' ? 'l' : 'L'
  return axis === 'width' ? '2 * l + 2 * L + 70' : 'H'
}
