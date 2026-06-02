'use server'

import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'
import { getCrmApiUrl, type CrmSignedQuote } from './crm-config'

export type SyncResult = {
  created: number
  alreadySynced: number
  notFound: string[]
  errors: string[]
}

export async function syncCrmSignedQuotes(): Promise<SyncResult> {
  await requireAuth()

  const crmUrl = await getCrmApiUrl()
  if (!crmUrl) throw new Error('Aucun CRM configuré')

  const base = crmUrl.replace(/\/$/, '')
  let signedQuotes: CrmSignedQuote[]

  try {
    const res = await fetch(`${base}/devis?status=signe`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    signedQuotes = await res.json()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`Impossible de joindre le CRM : ${msg}`)
  }

  const result: SyncResult = { created: 0, alreadySynced: 0, notFound: [], errors: [] }

  for (const sq of signedQuotes) {
    try {
      // Déjà synchronisé via crmQuoteId
      const existingByCrmId = await prisma.quote.findUnique({ where: { crmQuoteId: sq.crmId } })
      if (existingByCrmId) {
        result.alreadySynced++
        continue
      }

      // Trouver le devis par référence
      const quote = await prisma.quote.findFirst({
        where: { reference: sq.quoteReference },
        include: { productionSheet: { select: { id: true } } },
      })

      if (!quote) {
        result.notFound.push(sq.quoteReference)
        continue
      }

      // Créer la fiche de prod si elle n'existe pas encore
      await prisma.$transaction(async (tx) => {
        if (!quote.productionSheet) {
          await tx.productionSheet.create({
            data: { quoteId: quote.id, status: 'en_attente' },
          })
        }
        await tx.quote.update({
          where: { id: quote.id },
          data: { crmQuoteId: sq.crmId, crmSyncedAt: new Date() },
        })
      })

      result.created++
    } catch (e: unknown) {
      result.errors.push(`${sq.quoteReference}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return result
}
