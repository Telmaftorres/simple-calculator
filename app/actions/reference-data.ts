'use server'

import { prisma } from '@/lib/server/prisma'
import { unstable_cache } from 'next/cache'
import { requireAdmin } from '@/lib/server/auth'
import { revalidateCache } from '@/lib/server/cache'

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
          formatType: true,
          flatWidth: true,
          flatDepth: true,
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
          hasPoseEtiquette: true,
          hasAccessoires: true,
          accessoriesMargePercent: true,
          packagingMargePercent: true,
          hasTransport: true,
          defaultTransportMode: true,
          hasAmalgame: true,
          amalgameGroupsJson: true,
          accessories: {
            select: {
              accessoryId: true,
              quantity: true,
              accessory: { select: { id: true, name: true, price: true } },
            },
          },
          amalgameRuns: {
            orderBy: { position: 'asc' },
            select: {
              name: true,
              plateId: true,
              hasImpression: true,
              mainPerPlate: true,
              position: true,
              items: {
                select: {
                  name: true,
                  flatWidth: true,
                  flatHeight: true,
                  countPerPlate: true,
                  quantityPerUnit: true,
                },
              },
            },
          },
          templateElements: {
            select: {
              elementId: true,
              quantity: true,
              flatWidth: true,
              flatHeight: true,
              flatDepth: true,
              plateId: true,
              amalgameGroupId: true,
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
              element: { select: { id: true, name: true } },
            },
          },
          templateVariants: {
            select: {
              variantId: true,
              defaultQuantity: true,
              variant: {
                select: {
                  id: true,
                  label: true,
                  priceHT: true,
                  option: { select: { id: true, name: true, inputType: true } },
                },
              },
            },
          },
          templateOptionConfigs: {
            select: {
              optionId: true,
              defaultQuantity: true,
              option: { select: { id: true, name: true, inputType: true, priceHT: true } },
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

const getPlatesLocal = unstable_cache(
  async () => prisma.plate.findMany({ orderBy: { name: 'asc' } }),
  ['plates'],
  { tags: ['plates'] }
)

export async function getPlates() {
  const { getCrmApiUrl, getCrmHeaders } = await import('./crm-config')
  const crmUrl = await getCrmApiUrl()
  if (crmUrl) {
    try {
      const headers = await getCrmHeaders()
      const res = await fetch(`${crmUrl.replace(/\/$/, '')}/matieres`, {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 60 },
        headers,
      })
      if (res.ok) {
        const data = await res.json()
        return (data as { id: number | string; name: string; width: number; height: number; cost: number; material?: string }[])
          .map((p, i) => ({ id: typeof p.id === 'number' ? p.id : i + 1, name: p.name, width: p.width, height: p.height, cost: p.cost, material: p.material ?? '' }))
      }
    } catch { /* fallback local */ }
  }
  return getPlatesLocal()
}

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
  revalidateCache('packaging-rules')
}

export async function updateQuantityCoefficient(id: number, coefficient: number): Promise<void> {
  await requireAdmin()
  await prisma.quantityCoefficient.update({
    where: { id },
    data: { coefficient },
  })
  revalidateCache('packaging-rules')
}

// ─── Supplier quotes ───────────────────────────────────────────────────────

export type PackagingSupplierQuoteForAdmin = {
  id: number
  supplierName: string
  category: string
  material: string
  dimWidth: number | null
  dimHeight: number | null
  dimDepth: number | null
  unitPrice: number
  quotedAt: string
  notes: string | null
}

export async function getPackagingSupplierQuotes(): Promise<PackagingSupplierQuoteForAdmin[]> {
  const quotes = await prisma.packagingSupplierQuote.findMany({
    orderBy: [{ category: 'asc' }, { material: 'asc' }, { quotedAt: 'desc' }],
  })
  return quotes.map((q) => ({ ...q, quotedAt: q.quotedAt.toISOString() }))
}

function sizeMetric(q: { dimWidth: number | null; dimHeight: number | null; dimDepth: number | null }): number {
  const w = q.dimWidth ?? 0
  const h = q.dimHeight ?? 0
  const d = q.dimDepth ?? 0
  // Use volume; if depth missing use surface area as fallback
  return d > 0 ? w * h * d : w * h
}

// Assigns PETIT/MOYEN/GRAND by tertile within a sorted list of quotes.
// Returns a map of size → average unitPrice (only for non-empty groups).
function computeTertileAverages(
  quotes: { unitPrice: number; dimWidth: number | null; dimHeight: number | null; dimDepth: number | null }[]
): Record<string, number> {
  if (quotes.length === 0) return {}
  const sorted = [...quotes].sort((a, b) => sizeMetric(a) - sizeMetric(b))
  const N = sorted.length
  const groups: Record<string, number[]> = { PETIT: [], MOYEN: [], GRAND: [] }
  const sizes = ['PETIT', 'MOYEN', 'GRAND']
  sorted.forEach((q, i) => {
    groups[sizes[Math.min(2, Math.floor((i * 3) / N))]]!.push(q.unitPrice)
  })
  const result: Record<string, number> = {}
  for (const [size, prices] of Object.entries(groups)) {
    if (prices.length > 0) {
      result[size] = prices.reduce((s, p) => s + p, 0) / prices.length
    }
  }
  return result
}

async function recalculatePackagingByMaterial(category: string, material: string): Promise<void> {
  const quotes = await prisma.packagingSupplierQuote.findMany({
    where: { category, material },
    select: { unitPrice: true, dimWidth: true, dimHeight: true, dimDepth: true },
  })
  const averages = computeTertileAverages(quotes)
  for (const [size, avg] of Object.entries(averages)) {
    await prisma.packagingPricingRule.upsert({
      where: { category_material_size: { category, material, size } },
      update: { baseUnitPrice: avg },
      create: { category, material, size, baseUnitPrice: avg },
    })
  }
  revalidateCache('packaging-rules')
}

export async function createPackagingSupplierQuote(data: {
  supplierName: string
  category: string
  material: string
  dimWidth?: number
  dimHeight?: number
  dimDepth?: number
  unitPrice: number
  quotedAt?: string
  notes?: string
}): Promise<void> {
  await requireAdmin()
  await prisma.packagingSupplierQuote.create({
    data: {
      supplierName: data.supplierName,
      category: data.category,
      material: data.material,
      dimWidth: data.dimWidth ?? null,
      dimHeight: data.dimHeight ?? null,
      dimDepth: data.dimDepth ?? null,
      unitPrice: data.unitPrice,
      quotedAt: data.quotedAt ? new Date(data.quotedAt) : new Date(),
      notes: data.notes ?? null,
    },
  })
  await recalculatePackagingByMaterial(data.category, data.material)
}

export async function updatePackagingSupplierQuote(
  id: number,
  data: {
    supplierName?: string
    dimWidth?: number | null
    dimHeight?: number | null
    dimDepth?: number | null
    unitPrice?: number
    quotedAt?: string
    notes?: string
  }
): Promise<void> {
  await requireAdmin()
  const existing = await prisma.packagingSupplierQuote.findUniqueOrThrow({ where: { id } })
  await prisma.packagingSupplierQuote.update({
    where: { id },
    data: {
      ...(data.supplierName !== undefined && { supplierName: data.supplierName }),
      ...(data.dimWidth !== undefined && { dimWidth: data.dimWidth }),
      ...(data.dimHeight !== undefined && { dimHeight: data.dimHeight }),
      ...(data.dimDepth !== undefined && { dimDepth: data.dimDepth }),
      ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
      ...(data.quotedAt !== undefined && { quotedAt: new Date(data.quotedAt) }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  })
  await recalculatePackagingByMaterial(existing.category, existing.material)
}

export async function deletePackagingSupplierQuote(id: number): Promise<void> {
  await requireAdmin()
  const existing = await prisma.packagingSupplierQuote.findUniqueOrThrow({ where: { id } })
  await prisma.packagingSupplierQuote.delete({ where: { id } })
  await recalculatePackagingByMaterial(existing.category, existing.material)
}
