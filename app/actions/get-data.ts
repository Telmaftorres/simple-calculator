'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { unstable_cache } from 'next/cache'

/**
 * Fetches all studies from the database.
 */
export const getStudies = unstable_cache(
  async () => {
    return await prisma.study.findMany({
      orderBy: { createdAt: 'desc' },
    })
  },
  ['studies'],
  { tags: ['studies'] }
)

/**
 * Fetches all product types (PLV) with their associated elements.
 * Cached with tag 'product-types'
 */
export const getProductTypes = unstable_cache(
  async () => {
    return await prisma.productType.findMany({
      include: {
        elements: true,
      },
      orderBy: { name: 'asc' },
    })
  },
  ['product-types'],
  { tags: ['product-types'] }
)

/**
 * Fetches all available plates (materials).
 * Cached with tag 'plates'
 */
export const getPlates = unstable_cache(
  async () => {
    return await prisma.plate.findMany({
      orderBy: { name: 'asc' },
    })
  },
  ['plates'],
  { tags: ['plates'] }
)

export async function createQuote(data: {
  studyNumber: string
  productTypeId: number
  quantity: number
  width: number
  height: number
  plateId: number
  itemsPerPlate: number
  platesCount: number
  totalCost: number
  flatWidth?: number
  flatHeight?: number
  printSurface?: number
  cuttingMinutes?: number
  assemblySeconds?: number
  packSeconds?: number
  elements: { name: string; quantity: number }[]
  accessories?: { id: number; quantity: number }[]
}) {
  // ✅ Vérification d'authentification
  const session = await auth()
  if (!session?.user) throw new Error('Non autorisé')

  // Find or create the study
  let study = await prisma.study.findUnique({
    where: { number: data.studyNumber },
  })

  if (!study) {
    study = await prisma.study.create({
      data: {
        number: data.studyNumber,
        name: `Etude ${data.studyNumber}`,
      },
    })
  }

  return await prisma.quote.create({
    data: {
      studyId: study.id,
      productTypeId: data.productTypeId,
      quantity: data.quantity,
      width: data.width,
      height: data.height,
      plateId: data.plateId,
      itemsPerPlate: data.itemsPerPlate,
      platesCount: data.platesCount,
      totalCost: data.totalCost,
      flatWidth: data.flatWidth,
      flatHeight: data.flatHeight,
      printSurface: data.printSurface,
      cuttingMinutes: data.cuttingMinutes,
      assemblySeconds: data.assemblySeconds,
      packSeconds: data.packSeconds,
      userId: session.user.id, // ✅ Plus de '?' — on sait que la session existe
      accessories: {
        create: data.accessories?.map((acc) => ({
          accessoryId: acc.id,
          quantity: acc.quantity,
        })),
      },
    },
  })
}

export async function getUserQuotes() {
  const session = await auth()
  if (!session?.user?.id) return []

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
