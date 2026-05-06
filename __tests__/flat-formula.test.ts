import { describe, expect, it } from 'vitest'
import { evalFormula, resolveFlatFormula } from '@/lib/utils'

describe('flat formula helpers', () => {
  it('keeps the 2D default height formula in 2D mode', () => {
    expect(resolveFlatFormula('L', 'height', '2d')).toBe('L')
  })

  it('uses the standard 3D developed width formula when the product still has the 2D default', () => {
    const formula = resolveFlatFormula('l', 'width', '3d')
    expect(formula).toBe('2 * l + 2 * L + 70')
    expect(evalFormula(formula, 400, 50, 1700)).toBe(970)
  })

  it('uses product height instead of depth for a 3D default height formula', () => {
    const formula = resolveFlatFormula('L', 'height', '3d')
    expect(formula).toBe('H')
    expect(evalFormula(formula, 400, 50, 1700)).toBe(1700)
  })

  it('keeps explicit 3D formulas unchanged', () => {
    expect(resolveFlatFormula('100 + H + l + 100', 'height', '3d')).toBe('100 + H + l + 100')
    expect(evalFormula('100 + H + l + 100', 400, 50, 1700)).toBe(2300)
  })
})
