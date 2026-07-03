'use server'

import { prisma } from '@/lib/server/prisma'
import { requireAdmin, requireAuth } from '@/lib/server/auth'
import { revalidateCache } from '@/lib/server/cache'

export async function getStudies(companyId: number) {
  return prisma.study.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } })
}

export async function getProductTypes(companyId?: number) {
  const cid = companyId ?? (await requireAuth()).user.companyId ?? 0
  return prisma.productType.findMany({
    where: { companyId: cid },
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
  })
}

type CrmStockLot = {
  id_matiere?: string | number
  stock?: string | number
  quantite?: string | number
  cout_unitaire?: string | number
  date_reception?: string
}

// "2050 x 1525" ou "1000x1400" → { width, height }
function parseFormatMatiere(fmt: unknown): { width: number; height: number } {
  const parts = String(fmt ?? '').split(/\s*[x×]\s*/i)
  return { width: parseInt(parts[0], 10) || 0, height: parseInt(parts[1], 10) || 0 }
}

// Une matière a plusieurs lots (réceptions). On en tire un coût unitaire selon la méthode choisie.
function computeMatiereCost(lots: CrmStockLot[], method: string): number {
  if (lots.length === 0) return 0
  const num = (v: unknown) => parseFloat(String(v)) || 0
  if (method === 'weighted_avg') {
    const totQty = lots.reduce((s, l) => s + num(l.quantite), 0)
    if (totQty <= 0) return num(lots[0].cout_unitaire)
    return lots.reduce((s, l) => s + num(l.cout_unitaire) * num(l.quantite), 0) / totQty
  }
  // 'last_in_stock' → priorité aux lots encore en stock ; 'last_purchase' → tous les lots. Puis on prend le plus récent.
  const inStock = lots.filter((l) => num(l.stock) > 0)
  const pool = method === 'last_in_stock' && inStock.length > 0 ? inStock : lots
  const latest = pool.reduce((a, b) => (String(a.date_reception ?? '') >= String(b.date_reception ?? '') ? a : b))
  return num(latest.cout_unitaire)
}

export async function getPlates(companyId?: number) {
  const cid = companyId ?? (await requireAuth()).user.companyId ?? 0
  const { getCrmApiUrl, getCrmHeaders, getCrmCostMethod } = await import('./crm-config')
  const crmUrl = await getCrmApiUrl()
  if (crmUrl) {
    try {
      const base = crmUrl.replace(/\/$/, '')
      const headers = await getCrmHeaders()
      const [matRes, stockRes, costMethod] = await Promise.all([
        fetch(`${base}/matieres-premieres?par_page=100`, { signal: AbortSignal.timeout(5000), next: { revalidate: 60 }, headers }),
        fetch(`${base}/stock?par_page=100`, { signal: AbortSignal.timeout(5000), next: { revalidate: 60 }, headers }),
        getCrmCostMethod(),
      ])
      if (matRes.ok) {
        const matieres = ((await matRes.json())?.data ?? []) as { id_matiere: string | number; nom_matiere?: string; format_matiere?: string }[]
        // Regroupe les lots de stock par matière (un seul appel, groupé en mémoire).
        const stockByMat = new Map<string, CrmStockLot[]>()
        if (stockRes.ok) {
          for (const s of (((await stockRes.json())?.data ?? []) as CrmStockLot[])) {
            const k = String(s.id_matiere)
            const arr = stockByMat.get(k)
            if (arr) arr.push(s)
            else stockByMat.set(k, [s])
          }
        }
        return matieres.map((m) => {
          const { width, height } = parseFormatMatiere(m.format_matiere)
          const lots = stockByMat.get(String(m.id_matiere)) ?? []
          const stockRemaining = lots.reduce((sum, l) => sum + (parseFloat(String(l.stock)) || 0), 0)
          return {
            id: Number(m.id_matiere) || 0,
            name: m.nom_matiere ?? '',
            width,
            height,
            cost: computeMatiereCost(lots, costMethod),
            material: '',
            stockRemaining,
          }
        })
      }
    } catch { /* fallback local */ }
  }
  return prisma.plate.findMany({ where: { companyId: cid }, orderBy: { name: 'asc' } })
}

export type PackagingRulesData = {
  rules: { category: string; material: string; size: string; baseUnitPrice: number }[]
  coefficients: { minQuantity: number; maxQuantity: number | null; coefficient: number }[]
}

export async function getPackagingRules(companyId: number): Promise<PackagingRulesData> {
  const [rules, coefficients] = await Promise.all([
    prisma.packagingPricingRule.findMany({ where: { companyId }, orderBy: [{ category: 'asc' }, { material: 'asc' }, { size: 'asc' }] }),
    prisma.quantityCoefficient.findMany({ where: { companyId }, orderBy: { minQuantity: 'asc' } }),
  ])
  return { rules, coefficients }
}

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

export async function getPackagingRulesForAdmin(companyId: number): Promise<{
  rules: PackagingRuleForAdmin[]
  coefficients: QuantityCoefficientForAdmin[]
}> {
  const [rules, coefficients] = await Promise.all([
    prisma.packagingPricingRule.findMany({ where: { companyId }, orderBy: [{ category: 'asc' }, { material: 'asc' }, { size: 'asc' }] }),
    prisma.quantityCoefficient.findMany({ where: { companyId }, orderBy: { minQuantity: 'asc' } }),
  ])
  return { rules, coefficients }
}

export async function updatePackagingPricingRule(id: number, baseUnitPrice: number): Promise<void> {
  const session = await requireAdmin()
  const companyId = session.user.companyId
  if (!companyId) throw new Error('Aucune company associée')
  await prisma.packagingPricingRule.update({ where: { id, companyId }, data: { baseUnitPrice } })
  revalidateCache('packaging-rules')
}

export async function updateQuantityCoefficient(id: number, coefficient: number): Promise<void> {
  const session = await requireAdmin()
  const companyId = session.user.companyId
  if (!companyId) throw new Error('Aucune company associée')
  await prisma.quantityCoefficient.update({ where: { id, companyId }, data: { coefficient } })
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

export async function getPackagingSupplierQuotes(companyId: number): Promise<PackagingSupplierQuoteForAdmin[]> {
  const quotes = await prisma.packagingSupplierQuote.findMany({
    where: { companyId },
    orderBy: [{ category: 'asc' }, { material: 'asc' }, { quotedAt: 'desc' }],
  })
  return quotes.map((q) => ({ ...q, quotedAt: q.quotedAt.toISOString() }))
}

function sizeMetric(q: { dimWidth: number | null; dimHeight: number | null; dimDepth: number | null }): number {
  const w = q.dimWidth ?? 0
  const h = q.dimHeight ?? 0
  const d = q.dimDepth ?? 0
  return d > 0 ? w * h * d : w * h
}

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

async function recalculatePackagingByMaterial(category: string, material: string, companyId: number): Promise<void> {
  const quotes = await prisma.packagingSupplierQuote.findMany({
    where: { category, material, companyId },
    select: { unitPrice: true, dimWidth: true, dimHeight: true, dimDepth: true },
  })
  const averages = computeTertileAverages(quotes)
  for (const [size, avg] of Object.entries(averages)) {
    await prisma.packagingPricingRule.upsert({
      where: { category_material_size_companyId: { category, material, size, companyId } },
      update: { baseUnitPrice: avg },
      create: { category, material, size, baseUnitPrice: avg, companyId },
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
  const session = await requireAdmin()
  const companyId = session.user.companyId
  if (!companyId) throw new Error('Aucune company associée')
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
      companyId,
    },
  })
  await recalculatePackagingByMaterial(data.category, data.material, companyId)
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
  const session = await requireAdmin()
  const companyId = session.user.companyId
  if (!companyId) throw new Error('Aucune company associée')
  const existing = await prisma.packagingSupplierQuote.findFirstOrThrow({ where: { id, companyId } })
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
  await recalculatePackagingByMaterial(existing.category, existing.material, companyId)
}

export async function deletePackagingSupplierQuote(id: number): Promise<void> {
  const session = await requireAdmin()
  const companyId = session.user.companyId
  if (!companyId) throw new Error('Aucune company associée')
  const existing = await prisma.packagingSupplierQuote.findFirstOrThrow({ where: { id, companyId } })
  await prisma.packagingSupplierQuote.delete({ where: { id } })
  await recalculatePackagingByMaterial(existing.category, existing.material, companyId)
}
