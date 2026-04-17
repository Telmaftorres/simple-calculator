/**
 * Tarification emballage (étuis B/EB, avec extension future C/BC/CAISSE/PLAQUE_RAINEE)
 *
 * Flux :
 *   resolveSize(material, widthMm)      → 'PETIT' | 'MOYEN' | 'GRAND'
 *   resolveQuantityBand(quantity)       → 'PETITE_SERIE' | 'MOYENNE_SERIE' | 'GRANDE_SERIE'
 *   getSuggestedUnitPrice(params)       → PricingResult (lit la DB)
 *   getSuggestedUnitPricePure(params)   → PricingResult (sans DB, pour tests unitaires)
 */

import { prisma } from '@/lib/server/prisma'

// ── Enums ──────────────────────────────────────────────────────────────────

export const PackagingCategory = {
  ETUI: 'ETUI',
  CAISSE: 'CAISSE',
  PLAQUE_RAINEE: 'PLAQUE_RAINEE',
} as const
export type PackagingCategory = (typeof PackagingCategory)[keyof typeof PackagingCategory]

export const PackagingMaterial = {
  B: 'B',
  EB: 'EB',
  C: 'C',
  BC: 'BC',
} as const
export type PackagingMaterial = (typeof PackagingMaterial)[keyof typeof PackagingMaterial]

export const PackagingSize = {
  PETIT: 'PETIT',
  MOYEN: 'MOYEN',
  GRAND: 'GRAND',
} as const
export type PackagingSize = (typeof PackagingSize)[keyof typeof PackagingSize]

export const QuantityBand = {
  PETITE_SERIE: 'PETITE_SERIE',
  MOYENNE_SERIE: 'MOYENNE_SERIE',
  GRANDE_SERIE: 'GRANDE_SERIE',
} as const
export type QuantityBand = (typeof QuantityBand)[keyof typeof QuantityBand]

// ── Règles de taille ───────────────────────────────────────────────────────

/**
 * Détermine la taille d'emballage selon la matière et la largeur du produit (mm).
 * Extensible : ajouter les cas C/BC quand les règles seront définies.
 */
export function resolveSize(
  material: PackagingMaterial,
  widthMm: number
): PackagingSize {
  switch (material) {
    case PackagingMaterial.EB:
      if (widthMm < 900) return PackagingSize.PETIT
      if (widthMm <= 1100) return PackagingSize.MOYEN
      return PackagingSize.GRAND

    case PackagingMaterial.B:
      if (widthMm < 700) return PackagingSize.PETIT
      if (widthMm <= 1000) return PackagingSize.MOYEN
      return PackagingSize.GRAND

    // Règles C/BC à définir ultérieurement
    case PackagingMaterial.C:
    case PackagingMaterial.BC:
      throw new Error(
        `resolveSize: règles de taille non encore définies pour la matière "${material}"`
      )

    default: {
      const _exhaustive: never = material
      throw new Error(`resolveSize: matière inconnue "${_exhaustive}"`)
    }
  }
}

// ── Tranches de quantité ───────────────────────────────────────────────────

/**
 * Détermine la tranche de quantité.
 * 1–99 = PETITE_SERIE, 100–199 = MOYENNE_SERIE, 200+ = GRANDE_SERIE
 */
export function resolveQuantityBand(quantity: number): QuantityBand {
  if (quantity < 1) throw new Error('resolveQuantityBand: la quantité doit être >= 1')
  if (quantity <= 99) return QuantityBand.PETITE_SERIE
  if (quantity <= 199) return QuantityBand.MOYENNE_SERIE
  return QuantityBand.GRANDE_SERIE
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface PricingInput {
  category: PackagingCategory
  material: PackagingMaterial
  widthMm: number
  quantity: number
}

export interface PricingResult {
  category: PackagingCategory
  material: PackagingMaterial
  widthMm: number
  quantity: number
  size: PackagingSize
  quantityBand: QuantityBand
  baseUnitPrice: number
  coefficient: number
  finalUnitPrice: number
}

// ── Version pure (sans DB) — pour tests unitaires ──────────────────────────

interface PricingData {
  rules: Record<string, number>          // clé: `${category}_${material}_${size}`
  coefficients: Record<string, number>   // clé: QuantityBand
}

export function getSuggestedUnitPricePure(
  input: PricingInput,
  data: PricingData
): PricingResult {
  const { category, material, widthMm, quantity } = input

  const size = resolveSize(material, widthMm)
  const quantityBand = resolveQuantityBand(quantity)

  const ruleKey = `${category}_${material}_${size}`
  const baseUnitPrice = data.rules[ruleKey]
  if (baseUnitPrice === undefined) {
    throw new Error(`getSuggestedUnitPrice: aucune règle pour "${ruleKey}"`)
  }

  const coefficient = data.coefficients[quantityBand]
  if (coefficient === undefined) {
    throw new Error(`getSuggestedUnitPrice: aucun coefficient pour "${quantityBand}"`)
  }

  const finalUnitPrice = Math.round(baseUnitPrice * coefficient * 100) / 100

  return { category, material, widthMm, quantity, size, quantityBand, baseUnitPrice, coefficient, finalUnitPrice }
}

// ── Version DB ─────────────────────────────────────────────────────────────

/**
 * Calcule le prix unitaire conseillé en lisant la base de données.
 * Usage : server actions, API routes, RSC.
 */
export async function getSuggestedUnitPrice(
  input: PricingInput
): Promise<PricingResult> {
  const { category, material, widthMm, quantity } = input

  const size = resolveSize(material, widthMm)
  const quantityBand = resolveQuantityBand(quantity)

  const [rule, coeff] = await Promise.all([
    prisma.packagingPricingRule.findUnique({
      where: { category_material_size: { category, material, size } },
    }),
    prisma.quantityCoefficient.findUnique({
      where: { quantityBand },
    }),
  ])

  if (!rule) {
    throw new Error(
      `getSuggestedUnitPrice: aucune règle de prix pour ${category} / ${material} / ${size}`
    )
  }
  if (!coeff) {
    throw new Error(
      `getSuggestedUnitPrice: aucun coefficient pour la tranche "${quantityBand}"`
    )
  }

  const finalUnitPrice = Math.round(rule.baseUnitPrice * coeff.coefficient * 100) / 100

  return {
    category,
    material,
    widthMm,
    quantity,
    size,
    quantityBand,
    baseUnitPrice: rule.baseUnitPrice,
    coefficient: coeff.coefficient,
    finalUnitPrice,
  }
}
