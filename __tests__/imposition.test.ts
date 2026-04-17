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

  describe('plateBorderMm (marge de bord)', () => {
    it('plateBorderMm=0 donne le même résultat que sans 5e argument', () => {
      const withoutBorder = calculateImposition({ width: 100, height: 100 }, { width: 500, height: 500 }, 0)
      const withZero = calculateImposition({ width: 100, height: 100 }, { width: 500, height: 500 }, 0, undefined, 0)
      expect(withZero.itemsPerPlate).toBe(withoutBorder.itemsPerPlate)
      expect(withZero.orientation).toBe(withoutBorder.orientation)
    })

    it('réduit le nombre de poses par rapport à une plaque sans marge', () => {
      // Item 100×100, plaque 500×500, spacing 0
      // Sans marge : cols=5, rows=5 → 25
      // Avec plateBorderMm=50 : surface utile 400×400 → cols=4, rows=4 → 16
      const without = calculateImposition({ width: 100, height: 100 }, { width: 500, height: 500 }, 0)
      const with50 = calculateImposition({ width: 100, height: 100 }, { width: 500, height: 500 }, 0, undefined, 50)
      expect(without.itemsPerPlate).toBe(25)
      expect(with50.itemsPerPlate).toBe(16)
    })

    it('calcul exact avec plateBorderMm=10 et espacement 0', () => {
      // Item 100×100, plaque 500×500
      // surface utile : 500-2×10 = 480×480
      // cols = floor(480/100) = 4, rows = 4 → 16
      const result = calculateImposition({ width: 100, height: 100 }, { width: 500, height: 500 }, 0, undefined, 10)
      expect(result.itemsPerPlate).toBe(16)
    })

    it('calcul exact avec plateBorderMm et espacement combinés', () => {
      // Item 100×100, plaque 500×500, spacing 10, plateBorderMm=10
      // surface utile : 480×480
      // cols = floor((480+10)/(100+10)) = floor(490/110) = 4, rows = 4 → 16
      const result = calculateImposition({ width: 100, height: 100 }, { width: 500, height: 500 }, 10, undefined, 10)
      expect(result.itemsPerPlate).toBe(16)
    })

    it('retourne 0 si la marge dépasse les dimensions de la plaque', () => {
      // plateBorderMm=100 → surface utile max(0, 200-200)=0 → aucun item
      const result = calculateImposition({ width: 100, height: 100 }, { width: 200, height: 200 }, 0, undefined, 100)
      expect(result.itemsPerPlate).toBe(0)
      expect(result.layout).toHaveLength(0)
    })

    it('les items restent dans la surface utile (pas dans la marge)', () => {
      // Item 80×80, plaque 400×400, plateBorderMm=20, spacing=0
      // surface utile : 360×360, offset bord=20
      // Pas de décalage dans le layout (les positions x/y sont relatives à la surface utile)
      // cols=4, rows=4 → 16 items, dernier item à x=240+80=320 ≤ 360 ✓
      const result = calculateImposition({ width: 80, height: 80 }, { width: 400, height: 400 }, 0, undefined, 20)
      expect(result.itemsPerPlate).toBe(16)
      for (const rect of result.layout) {
        expect(rect.x + rect.width).toBeLessThanOrEqual(360)
        expect(rect.y + rect.height).toBeLessThanOrEqual(360)
      }
    })

    it('forceOrientation normal respecte plateBorderMm', () => {
      // Item 100×200, plaque 500×500, plateBorderMm=50 → surface 400×400
      // Normal : cols=floor(400/100)=4, rows=floor(400/200)=2 → 8
      const result = calculateImposition({ width: 100, height: 200 }, { width: 500, height: 500 }, 0, 'normal', 50)
      expect(result.itemsPerPlate).toBe(8)
      expect(result.orientation).toBe('normal')
    })

    it('forceOrientation rotated respecte plateBorderMm', () => {
      // Item 100×200 → rotated 200×100, plaque 500×500, plateBorderMm=50 → surface 400×400
      // Rotated : cols=floor(400/200)=2, rows=floor(400/100)=4 → 8
      const result = calculateImposition({ width: 100, height: 200 }, { width: 500, height: 500 }, 0, 'rotated', 50)
      expect(result.itemsPerPlate).toBe(8)
      expect(result.orientation).toBe('rotated')
    })
  })
})