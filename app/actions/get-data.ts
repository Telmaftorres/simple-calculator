'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'
import { z } from 'zod'
import { revalidateCache } from '@/lib/cache'

const createQuoteSchema = z.object({
  studyNumber: z.string().min(1, 'Le numéro de dossier est requis'),
  productTypeId: z.number().int().positive(),
  quantity: z.number().int().positive('La quantité doit être positive'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  plateId: z.number().int().positive(),
  itemsPerPlate: z.number().int().positive(),
  platesCount: z.number().int().positive(),
  totalCost: z.number().min(0),
  flatWidth: z.number().int().optional(),
  flatHeight: z.number().int().optional(),
  printSurface: z.number().min(0).max(100).optional(),
  printMode: z.string().optional(),
  isRectoVerso: z.boolean().optional(),
  rectoVersoType: z.string().nullable().optional(),
  hasVarnish: z.boolean().optional(),
  hasFlatColor: z.boolean().optional(),
  cuttingTimePerPoseSeconds: z.number().int().optional(),
  assemblyTimePerPieceSeconds: z.number().int().optional(),
  packTimePerPieceSeconds: z.number().int().optional(),
  hasAssemblyNotice: z.boolean().optional(),
  hasPackaging: z.boolean().optional(),
  packagingPlateId: z.number().int().positive().nullable().optional(),
  packagingQuantity: z.number().int().positive().nullable().optional(),
  packagingCuttingTimePerPoseSeconds: z.number().int().optional(),
  packagingWidth: z.number().int().positive().nullable().optional(),
  packagingHeight: z.number().int().positive().nullable().optional(),
  elements: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().int().positive(),
  })),
  accessories: z.array(z.object({
    id: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })).optional(),
  consumables: z.array(z.object({
    id: z.number().int().positive(),
    sizePerItem: z.number().positive(),
  })).optional(),
})

export const getStudies = unstable_cache(
  async () => {
    return await prisma.study.findMany({
      orderBy: { createdAt: 'desc' },
    })
  },
  ['studies'],
  { tags: ['studies'] }
)

export const getProductTypes = unstable_cache(
  async () => {
    return await prisma.productType.findMany({
      include: { elements: true },
      orderBy: { name: 'asc' },
    })
  },
  ['product-types'],
  { tags: ['product-types'] }
)

export const getPlates = unstable_cache(
  async () => {
    return await prisma.plate.findMany({
      orderBy: { name: 'asc' },
    })
  },
  ['plates'],
  { tags: ['plates'] }
)

async function generateReference(): Promise<string> {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear())
  const suffix = `${month}${year}`

  const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
    SELECT nextval('quote_reference_seq')
  `
  const number = String(Number(result[0].nextval)).padStart(4, '0')

  return `C${number}-${suffix}`
}

export async function createQuote(data: z.infer<typeof createQuoteSchema>) {
  const session = await requireAuth()
  const validated = createQuoteSchema.parse(data)

  let study = await prisma.study.findUnique({
    where: { number: validated.studyNumber },
  })

  if (!study) {
    study = await prisma.study.create({
      data: {
        number: validated.studyNumber,
        name: `Etude ${validated.studyNumber}`,
      },
    })
  }

  const reference = await generateReference()

  const productTypeExists = await prisma.productType.findUnique({
    where: { id: validated.productTypeId },
    select: { id: true },
  })

  if (!productTypeExists) {
    throw new Error(
      `Le type de PLV sélectionné (ID: ${validated.productTypeId}) n'existe plus. Veuillez actualiser la page.`
    )
  }

  revalidateCache('quotes')

  return await prisma.quote.create({
    data: {
      reference,
      studyId: study.id,
      productTypeId: validated.productTypeId,
      quantity: validated.quantity,
      width: validated.width,
      height: validated.height,
      plateId: validated.plateId,
      itemsPerPlate: validated.itemsPerPlate,
      platesCount: validated.platesCount,
      totalCost: validated.totalCost,
      flatWidth: validated.flatWidth,
      flatHeight: validated.flatHeight,
      printSurface: validated.printSurface,
      printMode: validated.printMode || 'production',
      isRectoVerso: validated.isRectoVerso || false,
      rectoVersoType: validated.rectoVersoType,
      hasVarnish: validated.hasVarnish || false,
      hasFlatColor: validated.hasFlatColor || false,
      cuttingTimePerPoseSeconds: validated.cuttingTimePerPoseSeconds || 20,
      assemblyTimePerPieceSeconds: validated.assemblyTimePerPieceSeconds || 0,
      packTimePerPieceSeconds: validated.packTimePerPieceSeconds || 0,
      hasAssemblyNotice: validated.hasAssemblyNotice || false,
      hasPackaging: validated.hasPackaging || false,
      packagingPlateId: validated.packagingPlateId || null,
      packagingQuantity: validated.packagingQuantity || null,
      packagingCuttingTimePerPoseSeconds: validated.packagingCuttingTimePerPoseSeconds || 20,
      packagingWidth: validated.packagingWidth || null,
      packagingHeight: validated.packagingHeight || null,
      userId: session.user.id,
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
}

export async function getUserQuotes() {
  const session = await requireAuth()

  return await prisma.quote.findMany({
    where: { userId: session.user.id },
    include: {
      study: true,
      productType: true,
      plate: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function deleteQuote(id: number) {
  const session = await requireAuth()

  const validId = z.number().int().positive().parse(id)

  const whereClause =
    session.user.role === 'ADMIN'
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
      productType: {
        include: { elements: true },
      },
      plate: true,
      accessories: {
        include: { accessory: true },
      },
      consumables: {
        include: { consumable: true },
      },
      elements: true,
    },
  })

  if (!quote) return null

  if (session.user.role !== 'ADMIN' && quote.userId !== session.user.id) {
    throw new Error('Non autorisé')
  }

  return quote
}