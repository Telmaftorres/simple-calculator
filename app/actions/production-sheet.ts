'use server'

import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const productionSheetSchema = z.object({
  nbCollages:           z.number().int().min(0).nullable().optional(),
  collagePerPLV:        z.number().min(0).nullable().optional(),
  faconnageNotes:       z.string().nullable().optional(),
  conditionnementType:  z.string().nullable().optional(),
  conditionnementNotes: z.string().nullable().optional(),
  achatsNotes:          z.string().nullable().optional(),
  remarques:            z.string().nullable().optional(),
  planImageUrl:         z.string().nullable().optional(),
  status:               z.enum(['en_attente', 'en_cours', 'termine']).optional(),
})

export type ProductionSheetInput = z.infer<typeof productionSheetSchema>

export async function upsertProductionSheet(quoteId: number, data: ProductionSheetInput) {
  const session = await requireAuth()

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { userId: true },
  })
  if (!quote) throw new Error('Devis introuvable')
  if (session.user.role !== 'ADMIN' && quote.userId !== session.user.id) {
    throw new Error('Non autorisé')
  }

  const validated = productionSheetSchema.parse(data)

  await prisma.productionSheet.upsert({
    where: { quoteId },
    update: { ...validated, updatedAt: new Date() },
    create: { quoteId, ...validated },
  })

  revalidatePath(`/dashboard/my-quotes/${quoteId}`)
}
