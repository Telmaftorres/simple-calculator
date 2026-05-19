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

export type ProductLineElementInput = {
  name: string
  flatWidth: number
  flatHeight: number
}

export type ProductLineInput = {
  name: string
  elements: ProductLineElementInput[]
}

export async function saveProductionProductLines(productionSheetId: number, lines: ProductLineInput[]) {
  const quoteId = await assertOwner(productionSheetId)

  await prisma.$transaction(async (tx) => {
    await tx.productionProductLine.deleteMany({ where: { productionSheetId } })
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      await tx.productionProductLine.create({
        data: {
          productionSheetId,
          name: line.name,
          position: i,
          elements: {
            create: line.elements.map((el, j) => ({
              name: el.name,
              flatWidth: el.flatWidth,
              flatHeight: el.flatHeight,
              position: j,
            })),
          },
        },
      })
    }
  })

  revalidatePath(`/dashboard/my-quotes/${quoteId}`)
}

export async function saveProductLinesPlate(
  plates: { lineId: number; plateId: number | null }[],
  quoteId: number
) {
  const session = await requireAuth()
  if (plates.length > 0) {
    const line = await prisma.productionProductLine.findUnique({
      where: { id: plates[0].lineId },
      select: { productionSheet: { select: { quote: { select: { userId: true } } } } },
    })
    if (!line) throw new Error('Ligne introuvable')
    const userId = line.productionSheet.quote.userId
    if (session.user.role !== 'ADMIN' && userId !== session.user.id) throw new Error('Non autorisé')
  }

  await Promise.all(
    plates.map(({ lineId, plateId }) =>
      prisma.productionProductLine.update({ where: { id: lineId }, data: { plateId } })
    )
  )

  revalidatePath(`/dashboard/my-quotes/${quoteId}`)
}
