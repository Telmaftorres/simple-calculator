'use server'

import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const productionSheetSchema = z.object({
  prodCuttingTimePerPoseSeconds:   z.number().min(0).nullable().optional(),
  prodAssemblyTimePerPieceSeconds: z.number().min(0).nullable().optional(),
  prodPackTimePerPieceSeconds:     z.number().min(0).nullable().optional(),
  prodInkMlPerPlate:               z.number().min(0).nullable().optional(),
  prodPlatesCount:                 z.number().int().min(0).nullable().optional(),
  prodMachineTimeMinOverride:      z.number().min(0).nullable().optional(),
  prodTransportCost:               z.number().min(0).nullable().optional(),
  prodTransportNotes:              z.string().nullable().optional(),
  amalgameScope:        z.enum(['decoupe', 'decoupe_impression']).nullable().optional(),
  beNotes:                    z.string().nullable().optional(),
  prodBeTimeMinutesOverride:  z.number().int().min(0).nullable().optional(),
  prodBatTimeMinutesOverride: z.number().int().min(0).nullable().optional(),
  impressionNotes:      z.string().nullable().optional(),
  prodIsRectoVerso:     z.boolean().nullable().optional(),
  prodRectoVersoType:   z.string().nullable().optional(),
  prodHasVarnish:       z.boolean().nullable().optional(),
  prodHasFlatColor:     z.boolean().nullable().optional(),
  decoupeNotes:         z.string().nullable().optional(),
  prodItemsPerPlate:    z.number().int().min(0).nullable().optional(),
  nbCollages:           z.number().int().min(0).nullable().optional(),
  collagePerPLV:        z.number().min(0).nullable().optional(),
  faconnageNotes:       z.string().nullable().optional(),
  conditionnementType:  z.string().nullable().optional(),
  conditionnementNotes: z.string().nullable().optional(),
  achatsNotes:          z.string().nullable().optional(),
  remarques:            z.string().nullable().optional(),
  delaiRealisation:     z.string().nullable().optional(),
  planImageUrl:         z.string().nullable().optional(),
  status:               z.enum(['en_attente', 'en_cours', 'termine']).optional(),
  formDataJson:         z.string().nullable().optional(),
  packagingBoxLengthMm:  z.number().int().min(0).nullable().optional(),
  packagingBoxWidthMm:   z.number().int().min(0).nullable().optional(),
  packagingBoxHeightMm:  z.number().int().min(0).nullable().optional(),
  packagingSupplierRef:  z.string().nullable().optional(),
  packagingNotes:        z.string().nullable().optional(),
  prodPackagingUnitPrice:  z.number().min(0).nullable().optional(),
  prodPackagingQuantity:   z.number().int().min(0).nullable().optional(),
  prodPackagingMaterial:   z.string().nullable().optional(),
})

export type ProductionSheetInput = z.infer<typeof productionSheetSchema>

async function assertOwner(quoteId: number) {
  await requireAuth()
  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, select: { userId: true } })
  if (!quote) throw new Error('Devis introuvable')
}

export async function upsertProductionSheet(quoteId: number, data: ProductionSheetInput) {
  await assertOwner(quoteId)
  const validated = productionSheetSchema.parse(data)
  await prisma.productionSheet.upsert({
    where: { quoteId },
    update: { ...validated, updatedAt: new Date() },
    create: { quoteId, ...validated },
  })
  revalidatePath(`/dashboard/my-quotes/${quoteId}`)
}

// Sauvegarde depuis le calculateur en mode "fiche de prod"
export async function saveProductionSheetFull(
  quoteId: number,
  formDataJson: string,
  extra: {
    status?: 'en_attente' | 'en_cours' | 'termine'
    remarques?: string | null
    planImageUrl?: string | null
    nbCollages?: number | null
    collagePerPLV?: number | null
    faconnageNotes?: string | null
    conditionnementType?: string | null
    conditionnementNotes?: string | null
    achatsNotes?: string | null
  }
) {
  await assertOwner(quoteId)
  await prisma.productionSheet.upsert({
    where: { quoteId },
    update: { formDataJson, ...extra, updatedAt: new Date() },
    create: { quoteId, formDataJson, ...extra },
  })
  revalidatePath(`/dashboard/my-quotes/${quoteId}`)
}

// Charge le devis + fiche de production (formDataJson) pour le calculateur
export async function getQuoteWithProductionSheet(quoteId: number) {
  await requireAuth()
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      study: true,
      productType: { include: { elements: true } },
      plate: true,
      accessories: { include: { accessory: true } },
      consumables: { include: { consumable: true } },
      elements: true,
      products: { include: { plate: true }, orderBy: { position: 'asc' } },
      transportDeliveries: true,
      amalgameRuns: {
        orderBy: { position: 'asc' },
        include: { plate: true, items: true },
      },
      productionSheet: true,
    },
  })
  if (!quote) return null
  return quote
}
