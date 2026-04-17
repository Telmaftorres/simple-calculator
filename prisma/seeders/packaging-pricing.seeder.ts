import { PrismaClient } from '@prisma/client'

const PRICING_RULES = [
  // Étui
  { category: 'ETUI', material: 'EB', size: 'PETIT', baseUnitPrice: 1.78 },
  { category: 'ETUI', material: 'EB', size: 'MOYEN', baseUnitPrice: 2.18 },
  { category: 'ETUI', material: 'EB', size: 'GRAND', baseUnitPrice: 4.95 },
  { category: 'ETUI', material: 'B',  size: 'PETIT', baseUnitPrice: 0.98 },
  { category: 'ETUI', material: 'B',  size: 'MOYEN', baseUnitPrice: 2.04 },
  { category: 'ETUI', material: 'B',  size: 'GRAND', baseUnitPrice: 3.13 },
  // Caisse
  { category: 'CAISSE', material: 'EB', size: 'PETIT', baseUnitPrice: 0 },
  { category: 'CAISSE', material: 'EB', size: 'MOYEN', baseUnitPrice: 0 },
  { category: 'CAISSE', material: 'EB', size: 'GRAND', baseUnitPrice: 0 },
  { category: 'CAISSE', material: 'B',  size: 'PETIT', baseUnitPrice: 0 },
  { category: 'CAISSE', material: 'B',  size: 'MOYEN', baseUnitPrice: 0 },
  { category: 'CAISSE', material: 'B',  size: 'GRAND', baseUnitPrice: 0 },
  // Plaque rainée
  { category: 'PLAQUE_RAINEE', material: 'EB', size: 'PETIT', baseUnitPrice: 0 },
  { category: 'PLAQUE_RAINEE', material: 'EB', size: 'MOYEN', baseUnitPrice: 0 },
  { category: 'PLAQUE_RAINEE', material: 'EB', size: 'GRAND', baseUnitPrice: 0 },
  { category: 'PLAQUE_RAINEE', material: 'B',  size: 'PETIT', baseUnitPrice: 0 },
  { category: 'PLAQUE_RAINEE', material: 'B',  size: 'MOYEN', baseUnitPrice: 0 },
  { category: 'PLAQUE_RAINEE', material: 'B',  size: 'GRAND', baseUnitPrice: 0 },
]

const QUANTITY_COEFFICIENTS = [
  { quantityBand: 'PETITE_SERIE',  minQuantity: 1,   maxQuantity: 99,  coefficient: 1.00 },
  { quantityBand: 'MOYENNE_SERIE', minQuantity: 100,  maxQuantity: 199, coefficient: 0.97 },
  { quantityBand: 'GRANDE_SERIE',  minQuantity: 200,  maxQuantity: null, coefficient: 0.92 },
] as const

export async function seedPackagingPricing(prisma: PrismaClient): Promise<void> {
  console.log('📦 Seeding packaging pricing rules...')

  for (const rule of PRICING_RULES) {
    await prisma.packagingPricingRule.upsert({
      where: { category_material_size: { category: rule.category, material: rule.material, size: rule.size } },
      update: { baseUnitPrice: rule.baseUnitPrice },
      create: rule,
    })
  }

  for (const coeff of QUANTITY_COEFFICIENTS) {
    await prisma.quantityCoefficient.upsert({
      where: { quantityBand: coeff.quantityBand },
      update: { minQuantity: coeff.minQuantity, maxQuantity: coeff.maxQuantity, coefficient: coeff.coefficient },
      create: coeff,
    })
  }

  console.log(`✅ ${PRICING_RULES.length} règles de prix + ${QUANTITY_COEFFICIENTS.length} coefficients quantité seedés.`)
}
