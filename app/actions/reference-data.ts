'use server'

import { prisma } from '@/lib/server/prisma'
import { unstable_cache, revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/server/auth'

export const getStudies = unstable_cache(
  async () => prisma.study.findMany({ orderBy: { createdAt: 'desc' } }),
  ['studies'],
  { tags: ['studies'] }
)

export const getProductTypes = unstable_cache(
  async () => prisma.productType.findMany({
    include: {
      elements: true,
      templates: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          flatWidth: true,
          flatHeight: true,
          plateId: true,
          hasImpression: true,
          printMode: true,
          printSetupType: true,
          isRectoVerso: true,
          rectoVersoType: true,
          hasVarnish: true,
          hasFlatColor: true,
          inkMlPerPlate: true,
          inkMlVerso: true,
          varnishSurfacePercent: true,
          flatColorSurfacePercent: true,
          cuttingTimePerPoseSeconds: true,
          cuttingSetupType: true,
          hasFaconnage: true,
          assemblyTimePerPieceSeconds: true,
          hasConditionnement: true,
          packTimePerPieceSeconds: true,
          hasAssemblyNotice: true,
          hasAccessoires: true,
          hasTransport: true,
          defaultTransportMode: true,
          accessories: {
            select: {
              accessoryId: true,
              quantity: true,
              accessory: { select: { id: true, name: true, price: true } },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  }),
  ['product-types'],
  { tags: ['product-types'] }
)

export const getPlates = unstable_cache(
  async () => prisma.plate.findMany({ orderBy: { name: 'asc' } }),
  ['plates'],
  { tags: ['plates'] }
)

export type PackagingRulesData = {
  rules: { category: string; material: string; size: string; baseUnitPrice: number }[]
  coefficients: { minQuantity: number; maxQuantity: number | null; coefficient: number }[]
}

export const getPackagingRules = unstable_cache(
  async (): Promise<PackagingRulesData> => {
    const [rules, coefficients] = await Promise.all([
      prisma.packagingPricingRule.findMany({ orderBy: [{ category: 'asc' }, { material: 'asc' }, { size: 'asc' }] }),
      prisma.quantityCoefficient.findMany({ orderBy: { minQuantity: 'asc' } }),
    ])
    return { rules, coefficients }
  },
  ['packaging-rules'],
  { tags: ['packaging-rules'] }
)

export type PackagingRuleForAdmin = {
  id: number
  category: string
  material: string
  size: string
  baseUnitPrice: number
}

export type QuantityCoefficientForAdmin = {
  id: number
  quantityBand: string
  minQuantity: number
  maxQuantity: number | null
  coefficient: number
}

export async function getPackagingRulesForAdmin(): Promise<{
  rules: PackagingRuleForAdmin[]
  coefficients: QuantityCoefficientForAdmin[]
}> {
  const [rules, coefficients] = await Promise.all([
    prisma.packagingPricingRule.findMany({
      orderBy: [{ category: 'asc' }, { material: 'asc' }, { size: 'asc' }],
    }),
    prisma.quantityCoefficient.findMany({ orderBy: { minQuantity: 'asc' } }),
  ])
  return { rules, coefficients }
}

export async function updatePackagingPricingRule(id: number, baseUnitPrice: number): Promise<void> {
  await requireAdmin()
  await prisma.packagingPricingRule.update({
    where: { id },
    data: { baseUnitPrice },
  })
  revalidateTag('packaging-rules')
}

export async function updateQuantityCoefficient(id: number, coefficient: number): Promise<void> {
  await requireAdmin()
  await prisma.quantityCoefficient.update({
    where: { id },
    data: { coefficient },
  })
  revalidateTag('packaging-rules')
}
