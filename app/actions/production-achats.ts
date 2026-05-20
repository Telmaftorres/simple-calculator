'use server'

import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'

export type AchatItemInput = {
  name: string
  quantity: number
  unitPrice?: number | null
}

export async function saveProductionAchatItems(productionSheetId: number, items: AchatItemInput[]) {
  const session = await requireAuth()
  const ps = await prisma.productionSheet.findUnique({
    where: { id: productionSheetId },
    select: { quote: { select: { id: true, userId: true } } },
  })
  if (!ps) throw new Error('Fiche de production introuvable')
  if (session.user.role !== 'ADMIN' && ps.quote.userId !== session.user.id) throw new Error('Non autorisé')

  await prisma.$transaction(async (tx) => {
    await tx.productionAchatItem.deleteMany({ where: { productionSheetId } })
    if (items.length > 0) {
      await tx.productionAchatItem.createMany({
        data: items.map((item, i) => ({
          productionSheetId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? null,
          position: i,
        })),
      })
    }
  })

  revalidatePath(`/dashboard/my-quotes/${ps.quote.id}`)
}
