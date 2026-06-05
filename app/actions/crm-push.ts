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

export async function pushChiffrageData(reference: string | null, studyId: number): Promise<number | null> {
  if (!reference) return null
  const crmUrl = await getCrmApiUrl()
  if (!crmUrl) return null
  try {
    const headers = await getCrmHeaders()
    const res = await fetch(`${crmUrl.replace(/\/$/, '')}/chiffrage`, {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, study_id: studyId }),
    })
    if (!res.ok) return null
    const json = await res.json().catch(() => null)
    return json?.id ?? null
  } catch {
    return null
  }
}

export async function pushChiffragePdf(chiffrageId: number, pdfBlob: Blob): Promise<void> {
  const crmUrl = await getCrmApiUrl()
  if (!crmUrl) return
  try {
    const headers = await getCrmHeaders()
    const form = new FormData()
    form.append('file', pdfBlob, `chiffrage-${chiffrageId}.pdf`)
    await fetch(`${crmUrl.replace(/\/$/, '')}/chiffrage/${chiffrageId}/pdf`, {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      headers,
      body: form,
    })
  } catch { /* silencieux */ }
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
