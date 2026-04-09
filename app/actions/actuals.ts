'use server'

import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { logAction } from '@/lib/server/audit'

const actualsSchema = z.object({
  actualCuttingTimePerPoseSeconds:   z.number().min(0).nullable().optional(),
  actualAssemblyTimePerPieceSeconds: z.number().min(0).nullable().optional(),
  actualPackTimePerPieceSeconds:     z.number().min(0).nullable().optional(),
  actualPlatesUsed:                  z.number().int().min(0).nullable().optional(),
  actualWastePercent:                z.number().min(0).max(100).nullable().optional(),
  actualTransportMode:               z.string().nullable().optional(),
  actualTransportCost:               z.number().min(0).nullable().optional(),
  actualWeightKg:                    z.number().min(0).nullable().optional(),
  notes:                             z.string().nullable().optional(),
})

export type ActualsInput = z.infer<typeof actualsSchema>

export async function upsertQuoteActuals(quoteId: number, data: ActualsInput) {
  const session = await requireAuth()

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { userId: true, reference: true },
  })
  if (!quote) throw new Error('Devis introuvable')
  if (session.user.role !== 'ADMIN' && quote.userId !== session.user.id) {
    throw new Error('Non autorisé')
  }

  const validated = actualsSchema.parse(data)

  await prisma.quoteActuals.upsert({
    where: { quoteId },
    update: { ...validated, updatedAt: new Date() },
    create: { quoteId, ...validated },
  })

  await logAction({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email,
    action: 'UPSERT_ACTUALS',
    entityType: 'Quote',
    entityRef: quote.reference ?? String(quoteId),
  })

  revalidatePath(`/dashboard/my-quotes/${quoteId}`)
}
