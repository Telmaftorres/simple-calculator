import { describe, it, expect } from 'vitest'
import { calculateImposition } from '@/lib/calculation/imposition'

describe('calculateImposition', () => {
  it('calculates normal orientation fit correctly', () => {
    // Item 100×50 on plate 400×300 with no spacing
    const result = calculateImposition({ width: 100, height: 50 }, { width: 400, height: 300 }, 0)
    // 4 cols (400/100) × 6 rows (300/50) = 24
    expect(result.itemsPerPlate).toBe(24)
    expect(result.orientation).toBe('normal')
    expect(result.layout).toHaveLength(24)
  })

  it('chooses rotated orientation when it fits more', () => {
    // Item 300×100 on plate 400×350
    // Normal: 1 col × 3 rows = 3
    // Rotated (100×300): 4 cols × 1 row = 4
    const result = calculateImposition({ width: 300, height: 100 }, { width: 400, height: 350 }, 0)
    expect(result.itemsPerPlate).toBe(4)
    expect(result.orientation).toBe('rotated')
  })

  it('accounts for spacing between items', () => {
    // Item 100×100 on plate 400×400 with 10mm spacing
    // cols = floor((400+10)/(100+10)) = floor(410/110) = 3
    // rows = floor((400+10)/(100+10)) = 3
    // 3 × 3 = 9
    const result = calculateImposition({ width: 100, height: 100 }, { width: 400, height: 400 }, 10)
    expect(result.itemsPerPlate).toBe(9)
  })

  it('returns 0 items when item is larger than plate', () => {
    const result = calculateImposition({ width: 500, height: 500 }, { width: 400, height: 300 }, 0)
    expect(result.itemsPerPlate).toBe(0)
    expect(result.layout).toHaveLength(0)
  })

  it('handles items with zero dimensions', () => {
    const result = calculateImposition({ width: 0, height: 100 }, { width: 400, height: 300 }, 0)
    expect(result.itemsPerPlate).toBe(0)
  })

  it('generates correct layout positions', () => {
    // 2 items per row, 2 rows, 5mm spacing
    const result = calculateImposition({ width: 100, height: 100 }, { width: 210, height: 210 }, 5)
    // cols = floor(215/105) = 2, rows = floor(215/105) = 2 → 4
    expect(result.itemsPerPlate).toBe(4)
    expect(result.layout[0]).toEqual({ x: 0, y: 0, width: 100, height: 100, rotated: false })
    expect(result.layout[1]).toEqual({ x: 105, y: 0, width: 100, height: 100, rotated: false })
    expect(result.layout[2]).toEqual({ x: 0, y: 105, width: 100, height: 100, rotated: false })
    expect(result.layout[3]).toEqual({ x: 105, y: 105, width: 100, height: 100, rotated: false }) 
   })

  it('handles single item fitting', () => {
    const result = calculateImposition({ width: 400, height: 300 }, { width: 400, height: 300 }, 0)
    expect(result.itemsPerPlate).toBe(1)
    expect(result.layout).toHaveLength(1)
  })
})