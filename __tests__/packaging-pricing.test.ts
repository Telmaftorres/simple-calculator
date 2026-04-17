import { describe, it, expect } from 'vitest'
import {
  resolveSize,
  resolveQuantityBand,
  getSuggestedUnitPricePure,
  PackagingCategory,
  PackagingMaterial,
  PackagingSize,
  QuantityBand,
  type PricingInput,
} from '@/lib/pricing/packaging-pricing'

// ── Données de référence (miroir du seeder) ────────────────────────────────

const RULES: Record<string, number> = {
  ETUI_EB_PETIT: 1.78,
  ETUI_EB_MOYEN: 2.18,
  ETUI_EB_GRAND: 4.95,
  ETUI_B_PETIT:  0.98,
  ETUI_B_MOYEN:  2.04,
  ETUI_B_GRAND:  3.13,
}

const COEFFICIENTS: Record<string, number> = {
  PETITE_SERIE:  1.00,
  MOYENNE_SERIE: 0.97,
  GRANDE_SERIE:  0.92,
}

// ── resolveSize ────────────────────────────────────────────────────────────

describe('resolveSize', () => {
  describe('matière EB', () => {
    it('PETIT si largeur < 900', () => {
      expect(resolveSize(PackagingMaterial.EB, 899)).toBe(PackagingSize.PETIT)
      expect(resolveSize(PackagingMaterial.EB, 770)).toBe(PackagingSize.PETIT)
      expect(resolveSize(PackagingMaterial.EB, 1)).toBe(PackagingSize.PETIT)
    })
    it('MOYEN si largeur entre 900 et 1100 inclus', () => {
      expect(resolveSize(PackagingMaterial.EB, 900)).toBe(PackagingSize.MOYEN)
      expect(resolveSize(PackagingMaterial.EB, 975)).toBe(PackagingSize.MOYEN)
      expect(resolveSize(PackagingMaterial.EB, 980)).toBe(PackagingSize.MOYEN)
      expect(resolveSize(PackagingMaterial.EB, 1100)).toBe(PackagingSize.MOYEN)
    })
    it('GRAND si largeur > 1100', () => {
      expect(resolveSize(PackagingMaterial.EB, 1101)).toBe(PackagingSize.GRAND)
      expect(resolveSize(PackagingMaterial.EB, 2000)).toBe(PackagingSize.GRAND)
    })
  })

  describe('matière B', () => {
    it('PETIT si largeur < 700', () => {
      expect(resolveSize(PackagingMaterial.B, 610)).toBe(PackagingSize.PETIT)
      expect(resolveSize(PackagingMaterial.B, 699)).toBe(PackagingSize.PETIT)
    })
    it('MOYEN si largeur entre 700 et 1000 inclus', () => {
      expect(resolveSize(PackagingMaterial.B, 700)).toBe(PackagingSize.MOYEN)
      expect(resolveSize(PackagingMaterial.B, 806)).toBe(PackagingSize.MOYEN)
      expect(resolveSize(PackagingMaterial.B, 1000)).toBe(PackagingSize.MOYEN)
    })
    it('GRAND si largeur > 1000', () => {
      expect(resolveSize(PackagingMaterial.B, 1001)).toBe(PackagingSize.GRAND)
      expect(resolveSize(PackagingMaterial.B, 1120)).toBe(PackagingSize.GRAND)
    })
  })

  it('lève une erreur pour matière C/BC (non encore définie)', () => {
    expect(() => resolveSize(PackagingMaterial.C, 800)).toThrow()
    expect(() => resolveSize(PackagingMaterial.BC, 800)).toThrow()
  })
})

// ── resolveQuantityBand ────────────────────────────────────────────────────

describe('resolveQuantityBand', () => {
  it('PETITE_SERIE de 1 à 99', () => {
    expect(resolveQuantityBand(1)).toBe(QuantityBand.PETITE_SERIE)
    expect(resolveQuantityBand(50)).toBe(QuantityBand.PETITE_SERIE)
    expect(resolveQuantityBand(99)).toBe(QuantityBand.PETITE_SERIE)
  })
  it('MOYENNE_SERIE de 100 à 199', () => {
    expect(resolveQuantityBand(100)).toBe(QuantityBand.MOYENNE_SERIE)
    expect(resolveQuantityBand(159)).toBe(QuantityBand.MOYENNE_SERIE)
    expect(resolveQuantityBand(199)).toBe(QuantityBand.MOYENNE_SERIE)
  })
  it('GRANDE_SERIE 200 et plus', () => {
    expect(resolveQuantityBand(200)).toBe(QuantityBand.GRANDE_SERIE)
    expect(resolveQuantityBand(304)).toBe(QuantityBand.GRANDE_SERIE)
    expect(resolveQuantityBand(10000)).toBe(QuantityBand.GRANDE_SERIE)
  })
  it('lève une erreur pour quantité < 1', () => {
    expect(() => resolveQuantityBand(0)).toThrow()
    expect(() => resolveQuantityBand(-1)).toThrow()
  })
})

// ── getSuggestedUnitPricePure ──────────────────────────────────────────────

describe('getSuggestedUnitPricePure', () => {
  const calc = (input: PricingInput) =>
    getSuggestedUnitPricePure(input, { rules: RULES, coefficients: COEFFICIENTS })

  // ── Cas de test requis ──

  it('1. ETUI / EB / largeur 770 / qté 50 → PETIT / PETITE_SERIE / 1.78', () => {
    const r = calc({ category: 'ETUI', material: 'EB', widthMm: 770, quantity: 50 })
    expect(r.size).toBe('PETIT')
    expect(r.quantityBand).toBe('PETITE_SERIE')
    expect(r.baseUnitPrice).toBe(1.78)
    expect(r.coefficient).toBe(1.00)
    expect(r.finalUnitPrice).toBe(1.78)
  })

  it('2. ETUI / EB / largeur 975 / qté 159 → MOYEN / MOYENNE_SERIE / 2.11', () => {
    const r = calc({ category: 'ETUI', material: 'EB', widthMm: 975, quantity: 159 })
    expect(r.size).toBe('MOYEN')
    expect(r.quantityBand).toBe('MOYENNE_SERIE')
    expect(r.baseUnitPrice).toBe(2.18)
    expect(r.coefficient).toBe(0.97)
    expect(r.finalUnitPrice).toBe(2.11)
  })

  it('3. ETUI / EB / largeur 980 / qté 304 → MOYEN / GRANDE_SERIE / 2.01', () => {
    const r = calc({ category: 'ETUI', material: 'EB', widthMm: 980, quantity: 304 })
    expect(r.size).toBe('MOYEN')
    expect(r.quantityBand).toBe('GRANDE_SERIE')
    expect(r.baseUnitPrice).toBe(2.18)
    expect(r.coefficient).toBe(0.92)
    expect(r.finalUnitPrice).toBe(2.01)
  })

  it('4. ETUI / B / largeur 610 / qté 50 → PETIT / PETITE_SERIE / 0.98', () => {
    const r = calc({ category: 'ETUI', material: 'B', widthMm: 610, quantity: 50 })
    expect(r.size).toBe('PETIT')
    expect(r.quantityBand).toBe('PETITE_SERIE')
    expect(r.baseUnitPrice).toBe(0.98)
    expect(r.coefficient).toBe(1.00)
    expect(r.finalUnitPrice).toBe(0.98)
  })

  it('5. ETUI / B / largeur 806 / qté 254 → MOYEN / GRANDE_SERIE / 1.88', () => {
    const r = calc({ category: 'ETUI', material: 'B', widthMm: 806, quantity: 254 })
    expect(r.size).toBe('MOYEN')
    expect(r.quantityBand).toBe('GRANDE_SERIE')
    expect(r.baseUnitPrice).toBe(2.04)
    expect(r.coefficient).toBe(0.92)
    expect(r.finalUnitPrice).toBe(1.88)
  })

  it('6. ETUI / B / largeur 1120 / qté 103 → GRAND / MOYENNE_SERIE / 3.04', () => {
    const r = calc({ category: 'ETUI', material: 'B', widthMm: 1120, quantity: 103 })
    expect(r.size).toBe('GRAND')
    expect(r.quantityBand).toBe('MOYENNE_SERIE')
    expect(r.baseUnitPrice).toBe(3.13)
    expect(r.coefficient).toBe(0.97)
    expect(r.finalUnitPrice).toBe(3.04)
  })

  // ── Structure du résultat ──

  it('retourne un objet complet avec tous les champs', () => {
    const r = calc({ category: 'ETUI', material: 'EB', widthMm: 975, quantity: 159 })
    expect(r).toMatchObject({
      category: 'ETUI',
      material: 'EB',
      widthMm: 975,
      quantity: 159,
    })
    expect(typeof r.finalUnitPrice).toBe('number')
    expect(Number.isFinite(r.finalUnitPrice)).toBe(true)
  })

  it('lève une erreur si la règle est absente', () => {
    expect(() =>
      calc({ category: 'CAISSE' as PackagingCategory, material: 'B', widthMm: 500, quantity: 10 })
    ).toThrow()
  })
})
