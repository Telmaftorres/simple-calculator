'use server'

import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'

async function assertOwner(productionSheetId: number) {
  const session = await requireAuth()
  const ps = await prisma.productionSheet.findUnique({
    where: { id: productionSheetId },
    select: { quote: { select: { id: true, userId: true } } },
  })
  if (!ps) throw new Error('Fiche de production introuvable')
  if (session.user.role !== 'ADMIN' && ps.quote.userId !== session.user.id) throw new Error('Non autorisé')
  return ps.quote.id
}

export type AmalgameItemInput = {
  name: string
  flatWidth: number
  flatHeight: number
  flatDepth: number | null
  countPerPlate: number
  quantityPerUnit: number
}

export type AmalgameRunInput = {
  name: string
  notes?: string | null
  platesCount?: number | null
  items: AmalgameItemInput[]
}

// Remplace tous les runs de production d'une fiche (transaction atomique)
export async function saveProductionAmalgameRuns(productionSheetId: number, runs: AmalgameRunInput[]) {
  const quoteId = await assertOwner(productionSheetId)

  await prisma.$transaction(async (tx) => {
    await tx.productionAmalgameRun.deleteMany({ where: { productionSheetId } })
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i]
      await tx.productionAmalgameRun.create({
        data: {
          productionSheetId,
          name: run.name,
          notes: run.notes ?? null,
          platesCount: run.platesCount ?? null,
          position: i,
          items: {
            create: run.items.map((item, j) => ({
              name: item.name,
              flatWidth: item.flatWidth,
              flatHeight: item.flatHeight,
              flatDepth: item.flatDepth ?? null,
              countPerPlate: item.countPerPlate,
              quantityPerUnit: item.quantityPerUnit,
              position: j,
            })),
          },
        },
      })
    }
  })

  revalidatePath(`/dashboard/my-quotes/${quoteId}`)
}

// Crée (ou retourne) la fiche de prod et renvoie son id
export async function ensureProductionSheet(quoteId: number): Promise<number> {
  const session = await requireAuth()
  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, select: { userId: true } })
  if (!quote) throw new Error('Devis introuvable')
  if (session.user.role !== 'ADMIN' && quote.userId !== session.user.id) throw new Error('Non autorisé')

  const ps = await prisma.productionSheet.upsert({
    where: { quoteId },
    create: { quoteId },
    update: {},
    select: { id: true },
  })
  return ps.id
}

// Templates pour le sélecteur "depuis un modèle"
export async function getProductTemplatesBasic() {
  await requireAuth()
  return prisma.productTemplate.findMany({
    select: {
      id: true,
      name: true,
      formatType: true,
      flatWidth: true,
      flatHeight: true,
      flatDepth: true,
      amalgameRuns: {
        orderBy: { position: 'asc' },
        include: { items: { orderBy: { id: 'asc' } } },
      },
    },
    orderBy: { name: 'asc' },
  })
}
