import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/server/prisma'
import { validateApiKey } from '@/app/actions/crm-config'

function unauthorized() {
  return NextResponse.json({ error: 'Clé API invalide ou manquante' }, { status: 401 })
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const key = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const { valid, companyId } = await validateApiKey(key)
  if (!valid || !companyId) return unauthorized()

  const quotes = await prisma.quote.findMany({
    where: { companyId },
    select: {
      id: true,
      reference: true,
      client: true,
      contactName: true,
      quantity: true,
      createdAt: true,
      updatedAt: true,
      crmQuoteId: true,
      crmSyncedAt: true,
      productionSheet: { select: { id: true, status: true, updatedAt: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    quotes.map(q => ({
      id: q.id,
      reference: q.reference,
      client: q.client,
      contactName: q.contactName,
      quantity: q.quantity,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      crmQuoteId: q.crmQuoteId,
      crmSyncedAt: q.crmSyncedAt,
      hasProductionSheet: !!q.productionSheet,
      productionSheetStatus: q.productionSheet?.status ?? null,
      productionSheetUrl: `/dashboard/my-quotes/${q.id}?tab=fiche`,
      createdBy: q.user?.name ?? q.user?.email ?? null,
    }))
  )
}
