'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { unstable_cache, revalidatePath } from 'next/cache'

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
  printMode?: string
  isRectoVerso?: boolean
  rectoVersoType?: string | null
  hasVarnish?: boolean
  hasFlatColor?: boolean
  cuttingTimePerPoseSeconds?: number
  assemblyTimePerPieceSeconds?: number
  packTimePerPieceSeconds?: number
  hasAssemblyNotice?: boolean
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

  // VERIFICATION SUPPLEMENTAIRE AVANT INSERTION POUR EVITER L'ERREUR 500 (Quote_productTypeId_fkey)
  const productTypeExists = await prisma.productType.findUnique({
    where: { id: data.productTypeId },
    select: { id: true }
  })

  if (!productTypeExists) {
    console.error(`Erreur: Tentative de création d'un devis pour un ProductType inexistant (ID: ${data.productTypeId})`)
    throw new Error(`Le type de PLV sélectionné (ID: ${data.productTypeId}) n'existe plus dans la base de données. Veuillez actualiser la page.`)
  }

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
      printMode: data.printMode || 'production',
      isRectoVerso: data.isRectoVerso || false,
      rectoVersoType: data.rectoVersoType,
      hasVarnish: data.hasVarnish || false,
      hasFlatColor: data.hasFlatColor || false,
      cuttingTimePerPoseSeconds: data.cuttingTimePerPoseSeconds || 20,
      assemblyTimePerPieceSeconds: data.assemblyTimePerPieceSeconds || 0,
      packTimePerPieceSeconds: data.packTimePerPieceSeconds || 0,
      hasAssemblyNotice: data.hasAssemblyNotice || false,
      userId: session.user.id,
      accessories: {
        create: data.accessories?.map((acc) => ({
          accessoryId: acc.id,
          quantity: acc.quantity,
        })),
      },
      elements: {
        create: data.elements.map((el) => ({
          name: el.name,
          quantity: el.quantity,
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

export async function deleteQuote(id: number) {
  const session = await auth()
  if (!session?.user) throw new Error('Non autorisé')

  await prisma.quote.delete({
    where: { id },
  })

  revalidatePath('/dashboard/my-quotes')
}

export async function getQuoteById(id: number) {
  const session = await auth()
  if (!session?.user) throw new Error('Non autorisé')

  return await prisma.quote.findUnique({
    where: { id },
    include: {
      study: true,
      productType: {
        include: {
          elements: true,
        },
      },
      plate: true,
      accessories: {
        include: {
          accessory: true,
        },
      },
      elements: true,
    },
  })
}
