'use server'

import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'

const CRM_URL_KEY = 'CRM_API_URL'
const CRM_INBOUND_KEY = 'CRM_API_KEY'
const CRM_OUTBOUND_KEY = 'CRM_OUTBOUND_KEY'

async function getCompanyId(): Promise<number | null> {
  const session = await requireAuth()
  return session.user.companyId ?? null
}

export async function getCrmApiUrl(): Promise<string | null> {
  const companyId = await getCompanyId()
  if (!companyId) return null
  const setting = await prisma.setting.findUnique({ where: { key_companyId: { key: CRM_URL_KEY, companyId } } })
  return setting?.value || null
}

export async function setCrmApiUrl(url: string | null) {
  await requireAuth()
  const companyId = await getCompanyId()
  if (!companyId) throw new Error('Aucune company associée')
  const value = url?.trim() || ''
  await prisma.setting.upsert({
    where: { key_companyId: { key: CRM_URL_KEY, companyId } },
    update: { value },
    create: { key: CRM_URL_KEY, value, label: 'URL API CRM', companyId },
  })
  revalidatePath('/settings')
  revalidatePath('/dashboard')
}

export async function getCrmOutboundKey(): Promise<string | null> {
  const companyId = await getCompanyId()
  if (!companyId) return null
  const setting = await prisma.setting.findUnique({ where: { key_companyId: { key: CRM_OUTBOUND_KEY, companyId } } })
  return setting?.value || null
}

export async function setCrmOutboundKey(key: string | null) {
  await requireAuth()
  const companyId = await getCompanyId()
  if (!companyId) throw new Error('Aucune company associée')
  const value = key?.trim() || ''
  await prisma.setting.upsert({
    where: { key_companyId: { key: CRM_OUTBOUND_KEY, companyId } },
    update: { value },
    create: { key: CRM_OUTBOUND_KEY, value, label: 'Clé API CRM sortante', companyId },
  })
  revalidatePath('/settings/crm')
}

export async function getCrmHeaders(): Promise<Record<string, string>> {
  const outboundKey = await getCrmOutboundKey()
  return {
    Accept: 'application/json',
    ...(outboundKey ? { Authorization: `Bearer ${outboundKey}` } : {}),
  }
}

export async function testCrmConnection(url: string): Promise<{ ok: boolean; message: string }> {
  await requireAuth()
  const trimmed = url.trim().replace(/\/$/, '')
  try {
    const headers = await getCrmHeaders()
    const res = await fetch(`${trimmed}/accessoires`, {
      signal: AbortSignal.timeout(5000),
      headers,
    })
    if (!res.ok) return { ok: false, message: `Erreur HTTP ${res.status}` }
    await res.json()
    return { ok: true, message: 'Connexion réussie ✓' }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, message: `Impossible de joindre le CRM : ${msg}` }
  }
}

// ── Clé API entrante (CRM → Calculateur) ──

export async function getApiKey(): Promise<string | null> {
  const companyId = await getCompanyId()
  if (!companyId) return null
  const setting = await prisma.setting.findUnique({ where: { key_companyId: { key: CRM_INBOUND_KEY, companyId } } })
  return setting?.value || null
}

export async function generateApiKey(): Promise<string> {
  await requireAuth()
  const companyId = await getCompanyId()
  if (!companyId) throw new Error('Aucune company associée')
  const { randomBytes } = await import('crypto')
  const key = randomBytes(32).toString('hex')
  await prisma.setting.upsert({
    where: { key_companyId: { key: CRM_INBOUND_KEY, companyId } },
    update: { value: key },
    create: { key: CRM_INBOUND_KEY, value: key, label: 'Clé API CRM', companyId },
  })
  revalidatePath('/settings/crm')
  return key
}

// ── Validation clé API entrante — retourne le companyId associé ──
export async function validateApiKey(key: string | null): Promise<{ valid: boolean; companyId: number | null }> {
  if (!key) return { valid: false, companyId: null }
  const setting = await prisma.setting.findFirst({ where: { key: CRM_INBOUND_KEY, value: key } })
  if (!setting) return { valid: false, companyId: null }
  return { valid: true, companyId: setting.companyId }
}

// ── Types CRM ──
export type CrmAccessory = { id: number | string; name: string; price: number; description?: string }
export type CrmPlate = { id: number | string; name: string; width: number; height: number; cost: number; material?: string }
export type CrmSignedQuote = {
  crmId: string
  quoteReference: string
  clientName?: string
  signedAt?: string
}
