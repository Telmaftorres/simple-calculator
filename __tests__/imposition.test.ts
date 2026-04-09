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

  describe('mixed orientation', () => {
    it('chooses mixed when it fits more than normal or rotated alone', () => {
      // Item 250×100 on plate 600×400, spacing 10
      // Normal  (250×100): cols=floor(610/260)=2, rows=floor(410/110)=3 → 6
      // Rotated (100×250): cols=floor(610/110)=5, rows=floor(410/260)=1 → 5
      // Mixed Cas A rN=1: usedH=100, remaining=400-100-10=290
      //   rowsR=calcFit(290,250)=floor(300/260)=1, colsR=floor(610/110)=5
      //   total = 2 + 5 = 7 → mixed wins
      const result = calculateImposition({ width: 250, height: 100 }, { width: 600, height: 400 }, 10)
      expect(result.orientation).toBe('mixed')
      expect(result.itemsPerPlate).toBe(7)
    })

    it('mixed layout items stay within plate bounds', () => {
      const result = calculateImposition({ width: 250, height: 100 }, { width: 600, height: 400 }, 10)
      expect(result.orientation).toBe('mixed')

      for (const rect of result.layout) {
        expect(rect.x).toBeGreaterThanOrEqual(0)
        expect(rect.y).toBeGreaterThanOrEqual(0)
        expect(rect.x + rect.width).toBeLessThanOrEqual(600)
        expect(rect.y + rect.height).toBeLessThanOrEqual(400)
      }
    })

    it('mixed layout items do not overlap', () => {
      const result = calculateImposition({ width: 250, height: 100 }, { width: 600, height: 400 }, 10)
      expect(result.orientation).toBe('mixed')

      for (let i = 0; i < result.layout.length; i++) {
        for (let j = i + 1; j < result.layout.length; j++) {
          const a = result.layout[i]
          const b = result.layout[j]
          const overlapX = a.x < b.x + b.width && a.x + a.width > b.x
          const overlapY = a.y < b.y + b.height && a.y + a.height > b.y
          expect(overlapX && overlapY).toBe(false)
        }
      }
    })

    it('regression: double-counted spacing does not place items outside plate bounds', () => {
      // Item 100×150 on plate 600×360, spacing 10
      // Normal  (100×150): cols=floor(610/110)=5, rows=floor(370/160)=2 → 10
      // Rotated (150×100): cols=floor(610/160)=3, rows=floor(370/110)=3 → 9
      // Mixed Cas A rN=1: usedH=150, remaining=360-150-10=200
      //   CORRECT: rowsR=calcFit(200,100)=floor(210/110)=1 → total=5+3=8 (normal wins with 10)
      //   BUG (+spacing): rowsR=calcFit(210,100)=floor(220/110)=2 → total=5+6=11
      //     → mixed would have "won" but row 2 would land at y=270..370, outside plate height 360
      const result = calculateImposition({ width: 100, height: 150 }, { width: 600, height: 360 }, 10)

      for (const rect of result.layout) {
        expect(rect.x).toBeGreaterThanOrEqual(0)
        expect(rect.y).toBeGreaterThanOrEqual(0)
        expect(rect.x + rect.width).toBeLessThanOrEqual(600)
        expect(rect.y + rect.height).toBeLessThanOrEqual(360)
      }
    })
  })
})