'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'
import { z } from 'zod'
import { revalidateCache } from '@/lib/cache'
import { createQuoteSchema, type CreateQuoteInput } from '@/lib/quote-schema'
import { QUOTE_DEFAULTS } from '@/lib/quote-defaults'

function buildQuoteData(
  validated: CreateQuoteInput,
  extra: { reference: string; studyId: number; userId: string }
) {
  return {
    reference: extra.reference,
    studyId: extra.studyId,
    userId: extra.userId,
    productTypeId: validated.productTypeId,
    quantity: validated.quantity,
    plateId: validated.plateId,
    itemsPerPlate: validated.itemsPerPlate,
    platesCount: validated.platesCount,
    totalCost: validated.totalCost,
    flatWidth: validated.flatWidth,
    flatHeight: validated.flatHeight,
    printMode: validated.printMode || QUOTE_DEFAULTS.printMode,
    isRectoVerso: validated.isRectoVerso ?? QUOTE_DEFAULTS.isRectoVerso,
    rectoVersoType: validated.rectoVersoType,
    inkMlPerPlate: validated.inkMlPerPlate ?? 20,
    varnishSurfacePercent: validated.varnishSurfacePercent ?? QUOTE_DEFAULTS.varnishSurfacePercent,
    flatColorSurfacePercent: validated.flatColorSurfacePercent ?? QUOTE_DEFAULTS.flatColorSurfacePercent,
    hasVarnish: validated.hasVarnish ?? QUOTE_DEFAULTS.hasVarnish,
    hasFlatColor: validated.hasFlatColor ?? QUOTE_DEFAULTS.hasFlatColor,
    cuttingTimePerPoseSeconds: validated.cuttingTimePerPoseSeconds ?? QUOTE_DEFAULTS.cuttingTimePerPoseSeconds,
    assemblyTimePerPieceSeconds: validated.assemblyTimePerPieceSeconds ?? QUOTE_DEFAULTS.assemblyTimePerPieceSeconds,
    packTimePerPieceSeconds: validated.packTimePerPieceSeconds ?? QUOTE_DEFAULTS.packTimePerPieceSeconds,
    hasAssemblyNotice: validated.hasAssemblyNotice ?? QUOTE_DEFAULTS.hasAssemblyNotice,
    hasPackaging: validated.hasPackaging ?? QUOTE_DEFAULTS.hasPackaging,
    packagingPlateId: validated.packagingPlateId || null,
    packagingQuantity: validated.packagingQuantity || null,
    packagingCuttingTimePerPoseSeconds: validated.packagingCuttingTimePerPoseSeconds ?? QUOTE_DEFAULTS.packagingCuttingTimePerPoseSeconds,
    packagingWidth: validated.packagingWidth || null,
    packagingHeight: validated.packagingHeight || null,
    hasPrintSetup: validated.hasPrintSetup ?? QUOTE_DEFAULTS.hasPrintSetup,
    hasCuttingSetup: validated.hasCuttingSetup ?? QUOTE_DEFAULTS.hasCuttingSetup,
    hasImpression: validated.hasImpression ?? QUOTE_DEFAULTS.hasImpression,
    hasFaconnage: validated.hasFaconnage ?? QUOTE_DEFAULTS.hasFaconnage,
    hasConditionnement: validated.hasConditionnement ?? QUOTE_DEFAULTS.hasConditionnement,
    hasAccessoires: validated.hasAccessoires ?? QUOTE_DEFAULTS.hasAccessoires,
  }
}

export const getStudies = unstable_cache(
  async () => prisma.study.findMany({ orderBy: { createdAt: 'desc' } }),
  ['studies'],
  { tags: ['studies'] }
)

export const getProductTypes = unstable_cache(
  async () => prisma.productType.findMany({ include: { elements: true }, orderBy: { name: 'asc' } }),
  ['product-types'],
  { tags: ['product-types'] }
)

export const getPlates = unstable_cache(
  async () => prisma.plate.findMany({ orderBy: { name: 'asc' } }),
  ['plates'],
  { tags: ['plates'] }
)

async function generateReference(): Promise<string> {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear())
  const result = await prisma.$queryRaw<[{ nextval: bigint }]>`SELECT nextval('quote_reference_seq')`
  const number = String(Number(result[0].nextval)).padStart(4, '0')
  return `C${number}-${month}${year}`
}

export async function createQuote(data: CreateQuoteInput) {
  const session = await requireAuth()
  const validated = createQuoteSchema.parse(data)

  // ✅ upsert atomique — plus de race condition
  const study = await prisma.study.upsert({
    where: { number: validated.studyNumber },
    update: {},
    create: {
      number: validated.studyNumber,
      name: `Etude ${validated.studyNumber}`,
    },
  })

  const productTypeExists = await prisma.productType.findUnique({
    where: { id: validated.productTypeId },
    select: { id: true },
  })
  if (!productTypeExists) {
    throw new Error('Le type de PLV sélectionné n\'existe plus.')
    // ✅ ID interne supprimé du message
  }

  const reference = await generateReference()

  // ✅ revalidateCache APRÈS la création
  const quote = await prisma.quote.create({
    data: {
      ...buildQuoteData(validated, {
        reference,
        studyId: study.id,
        userId: session.user.id,
      }),
      accessories: {
        create: validated.accessories?.map((acc) => ({
          accessoryId: acc.id,
          quantity: acc.quantity,
        })),
      },
      consumables: {
        create: validated.consumables?.map((c) => ({
          consumableId: c.id,
          sizePerItem: c.sizePerItem,
        })),
      },
      elements: {
        create: validated.elements.map((el) => ({
          name: el.name,
          quantity: el.quantity,
        })),
      },
    },
  })

  revalidateCache('quotes')
  return quote
}

export async function getUserQuotes() {
  const session = await requireAuth()
  return await prisma.quote.findMany({
    where: { userId: session.user.id },
    include: { study: true, productType: true, plate: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function deleteQuote(id: number) {
  const session = await requireAuth()
  const validId = z.number().int().positive().parse(id)
  const whereClause = session.user.role === 'ADMIN'
    ? { id: validId }
    : { id: validId, userId: session.user.id }
  await prisma.quote.delete({ where: whereClause })
  revalidateCache('quotes')
  revalidatePath('/dashboard/my-quotes')
}

export async function getQuoteById(id: number) {
  const session = await requireAuth()
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      study: true,
      productType: { include: { elements: true } },
      plate: true,
      accessories: { include: { accessory: true } },
      consumables: { include: { consumable: true } },
      elements: true,
    },
  })
  if (!quote) return null
  if (session.user.role !== 'ADMIN' && quote.userId !== session.user.id) {
    throw new Error('Non autorisé')
  }
  return quote
}