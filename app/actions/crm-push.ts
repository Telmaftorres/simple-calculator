'use server'

import { prisma } from '@/lib/server/prisma'
import { getCrmApiUrl, getCrmHeaders } from './crm-config'

export type CrmPushLine = {
  description: string
  prixAchat: number
  marge: number
  prixVente: number
}

export type CrmPushPayload = {
  reference: string | null
  studyNumber: string
  client: string | null
  quantity: number
  lignes: CrmPushLine[]
}

export async function pushQuoteToCrm(quoteId: number, payload: CrmPushPayload): Promise<void> {
  const crmUrl = await getCrmApiUrl()
  if (!crmUrl) return

  const base = crmUrl.replace(/\/$/, '')
  try {
    const headers = await getCrmHeaders()
    const res = await fetch(`${base}/devis`, {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return

    const json = await res.json().catch(() => null)
    const crmId = json?.crmId ?? json?.id ?? null
    if (crmId) {
      await prisma.quote.update({
        where: { id: quoteId },
        data: { crmQuoteId: String(crmId), crmSyncedAt: new Date() },
      })
    }
  } catch {
    // Push CRM en best-effort — échec silencieux pour ne pas bloquer le save
  }
}
