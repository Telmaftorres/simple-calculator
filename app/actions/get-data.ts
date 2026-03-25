'use server'

import { prisma } from '@/lib/prisma'
import { type Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/auth-helpers'
import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'
import { z } from 'zod'
import { revalidateCache } from '@/lib/cache'
import { createQuoteSchema, type CreateQuoteInput } from '@/lib/quote-schema'

function buildQuoteData(
  validated: CreateQuoteInput,
  extra: { reference: string; studyId: number; userId: string }
): Omit<Prisma.QuoteUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'> {
  // ✅ Exclure les champs qui ne vont pas directement en DB
  const {
    studyNumber,   // géré via upsert Study → studyId dans extra
    elements,      // géré séparément dans prisma.quote.create
    accessories,   // géré séparément dans prisma.quote.create
    consumables,   // géré séparément dans prisma.quote.create
    ...quoteFields // tout le reste correspond exactement aux colonnes Prisma
  } = validated

  return {
    // ✅ Tous les champs scalaires alignés automatiquement
    ...quoteFields,

    // ✅ Champs injectés depuis l'extérieur
    ...extra,

    // ✅ Forcer null au lieu d'undefined pour les champs nullable
    // Prisma accepte null mais pas undefined
    packagingPlateId: validated.packagingPlateId ?? null,
    packagingQuantity: validated.packagingQuantity ?? null,
    packagingWidth: validated.packagingWidth ?? null,
    packagingHeight: validated.packagingHeight ?? null,
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
  }

  const reference = await generateReference()

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