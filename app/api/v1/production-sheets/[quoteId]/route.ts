import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/server/prisma'
import { validateApiKey } from '@/app/actions/crm-config'

function unauthorized() {
  return NextResponse.json({ error: 'Clé API invalide ou manquante' }, { status: 401 })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const authHeader = req.headers.get('Authorization')
  const key = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const { valid, companyId } = await validateApiKey(key)
  if (!valid || !companyId) return unauthorized()

  const { quoteId: raw } = await params
  const quoteId = parseInt(raw)
  if (isNaN(quoteId)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, companyId },
    include: {
      productionSheet: {
        include: {
          productionAchatItems: true,
          productionAmalgameRuns: { include: { items: true } },
          productionProductLines: { include: { elements: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
  })

  if (!quote) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

  const ps = quote.productionSheet

  return NextResponse.json({
    quote: {
      id: quote.id,
      reference: quote.reference,
      client: quote.client,
      contactName: quote.contactName,
      quantity: quote.quantity,
      crmQuoteId: quote.crmQuoteId,
      crmSyncedAt: quote.crmSyncedAt,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      createdBy: quote.user?.name ?? quote.user?.email ?? null,
      editUrl: `/dashboard/my-quotes/${quote.id}?tab=fiche`,
    },
    productionSheet: ps ? {
      id: ps.id,
      status: ps.status,
      delaiRealisation: ps.delaiRealisation,
      remarques: ps.remarques,
      updatedAt: ps.updatedAt,
      impression: {
        isRectoVerso: ps.prodIsRectoVerso,
        rectoVersoType: ps.prodRectoVersoType,
        hasVarnish: ps.prodHasVarnish,
        hasFlatColor: ps.prodHasFlatColor,
        machineTimeMin: ps.prodMachineTimeMinOverride,
        inkMlPerPlate: ps.prodInkMlPerPlate,
        platesCount: ps.prodPlatesCount,
        notes: ps.impressionNotes,
      },
      decoupe: {
        cuttingTimePerPoseSeconds: ps.prodCuttingTimePerPoseSeconds,
        itemsPerPlate: ps.prodItemsPerPlate,
        notes: ps.decoupeNotes,
      },
      faconnage: {
        assemblyTimePerPieceSeconds: ps.prodAssemblyTimePerPieceSeconds,
        nbCollages: ps.nbCollages,
        collagePerPLV: ps.collagePerPLV,
        notes: ps.faconnageNotes,
      },
      conditionnement: {
        packTimePerPieceSeconds: ps.prodPackTimePerPieceSeconds,
        type: ps.conditionnementType,
        notes: ps.conditionnementNotes,
      },
      achats: ps.productionAchatItems.map(a => ({
        name: a.name,
        quantity: a.quantity,
        unitPrice: a.unitPrice,
      })),
    } : null,
  })
}
