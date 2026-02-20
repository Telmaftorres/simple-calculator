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

/**
 * Génère une référence unique au format C0001-MMAAAA
 * Ex: C0001-022026, C0042-022026
 */
async function generateReference(): Promise<string> {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear())
  const suffix = `${month}${year}`

  // Compter le nombre de devis existants pour incrémenter le numéro
  const count = await prisma.quote.count()
  const number = String(count + 1).padStart(4, '0')

  return `C${number}-${suffix}`
}

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
  const session = await auth()
  if (!session?.user) throw new Error('Non autorisé')

  // Trouver ou créer l'étude
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

  // Générer la référence unique
  const reference = await generateReference()

  return await prisma.quote.create({
    data: {
      reference,
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
      userId: session.user.id,
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
