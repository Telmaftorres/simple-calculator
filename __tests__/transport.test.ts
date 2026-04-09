import { describe, it, expect } from 'vitest'
import {
  getPack30Rate,
  getMessagerieRate,
  calculateTransport,
  suggestTransportMode,
} from '@/lib/transport/geodis-rates'

describe('getPack30Rate', () => {
  it('retourne le bon tarif pour zone Z01 (dept 76) ≤ 4kg', () => {
    expect(getPack30Rate('76', 2)).toBe(9.72)
  })

  it('retourne le bon tarif pour zone Z01 ≤ 9kg', () => {
    expect(getPack30Rate('76', 7)).toBe(12.13)
  })

  it('retourne le bon tarif pour zone Z02 (dept inconnu) ≤ 4kg', () => {
    expect(getPack30Rate('99', 2)).toBe(12.52)
  })

  it('retourne null si poids > 30kg', () => {
    expect(getPack30Rate('76', 31)).toBeNull()
  })

  it('retourne le bon tarif pour la Corse (dept 20)', () => {
    expect(getPack30Rate('20', 2)).toBe(75.60)
  })

  it('arrondit le poids au kg supérieur', () => {
    // 4.1kg → arrondi à 5kg → tranche 5-9
    expect(getPack30Rate('76', 4.1)).toBe(12.13)
  })
})

describe('getMessagerieRate', () => {
  it('retourne null si poids > 1000kg', () => {
    expect(getMessagerieRate('76', 1001)).toBeNull()
  })

  it('calcule le tarif forfait pour zone Z01 (dept 76) ≤ 4kg', () => {
    expect(getMessagerieRate('76', 3)).toBe(8.57)
  })

  it('calcule le tarif forfait pour un département inconnu (fallback Z06)', () => {
    const rate = getMessagerieRate('99', 5)
    expect(rate).toBe(22.54) // Z06, tranche 5-9kg
  })

  it('calcule le tarif aux 100kg pour 150kg', () => {
    // Z01, 150kg → arrondi 150kg → tranche 100-199 → rate[12]=23.79 → (23.79 * 150)/100
    const expected = (23.79 * 150) / 100
    expect(getMessagerieRate('76', 150)).toBeCloseTo(expected, 2)
  })
})

describe('calculateTransport', () => {
  it('retourne null si mode invalide', () => {
    expect(calculateTransport('PACK30', '76', 50, 1, 5, 0)).toBeNull()
  })

  it('calcule PACK30 avec supplément carburant', () => {
    const result = calculateTransport('PACK30', '76', 2, 1, 5, 0)
    expect(result).not.toBeNull()
    // basePrice = 9.72, fuel 5% = 0.49, subtotal = 10.21
    expect(result!.basePrice).toBe(9.72)
    expect(result!.fuelSurcharge).toBeCloseTo(9.72 * 0.05, 2)
    expect(result!.total).toBeCloseTo(9.72 + result!.fuelSurcharge, 2)
  })

  it('ajoute les options au total', () => {
    const sans = calculateTransport('PACK30', '76', 2, 1, 5, 0)
    const avec = calculateTransport('PACK30', '76', 2, 1, 5, 10)
    expect(avec!.total).toBeCloseTo(sans!.total + 10, 2)
  })

  it('calcule AFFRETEMENT correctement', () => {
    const result = calculateTransport('AFFRETEMENT', '76', 0, 2, 5, 0)
    expect(result).not.toBeNull()
    expect(result!.zone).toBe('2 palettes')
  })
})

describe('suggestTransportMode', () => {
  it('suggère PACK30 pour ≤ 30kg et 1 palette', () => {
    expect(suggestTransportMode(20, 1)).toBe('PACK30')
  })

  it('suggère AFFRETEMENT pour ≥ 2 palettes et ≥ 500kg', () => {
    expect(suggestTransportMode(600, 3)).toBe('AFFRETEMENT')
  })

  it('suggère MESSAGERIE_PLUS pour les cas intermédiaires', () => {
    expect(suggestTransportMode(100, 1)).toBe('MESSAGERIE_PLUS')
  })
})
