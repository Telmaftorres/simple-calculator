'use server'

import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'

const CRM_URL_KEY = 'CRM_API_URL'
const CRM_API_KEY = 'CRM_API_KEY'
const CRM_OUTBOUND_KEY = 'CRM_OUTBOUND_KEY'

export async function getCrmApiUrl(): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key: CRM_URL_KEY } })
  return setting?.value || null
}

export async function setCrmApiUrl(url: string | null) {
  await requireAuth()
  const value = url?.trim() || ''
  await prisma.setting.upsert({
    where: { key: CRM_URL_KEY },
    update: { value },
    create: { key: CRM_URL_KEY, value, label: 'URL API CRM' },
  })
  revalidatePath('/settings')
  revalidatePath('/dashboard')
}

export async function getCrmOutboundKey(): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key: CRM_OUTBOUND_KEY } })
  return setting?.value || null
}

export async function setCrmOutboundKey(key: string | null) {
  await requireAuth()
  const value = key?.trim() || ''
  await prisma.setting.upsert({
    where: { key: CRM_OUTBOUND_KEY },
    update: { value },
    create: { key: CRM_OUTBOUND_KEY, value, label: 'Clé API CRM sortante' },
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

// ── Clé API (pour que le CRM lise les endpoints du calculateur) ──

export async function getApiKey(): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key: CRM_API_KEY } })
  return setting?.value || null
}

export async function generateApiKey(): Promise<string> {
  await requireAuth()
  const { randomBytes } = await import('crypto')
  const key = randomBytes(32).toString('hex')
  await prisma.setting.upsert({
    where: { key: CRM_API_KEY },
    update: { value: key },
    create: { key: CRM_API_KEY, value: key, label: 'Clé API CRM' },
  })
  revalidatePath('/settings/crm')
  return key
}

// ── Validation clé API (utilisée dans les routes API) ──
export async function validateApiKey(key: string | null): Promise<boolean> {
  if (!key) return false
  const setting = await prisma.setting.findUnique({ where: { key: CRM_API_KEY } })
  return setting?.value === key
}

// ── Format attendu du CRM pour les accessoires ──
export type CrmAccessory = { id: number | string; name: string; price: number; description?: string }
// ── Format attendu du CRM pour les matières/plaques ──
export type CrmPlate = { id: number | string; name: string; width: number; height: number; cost: number; material?: string }
// ── Format attendu du CRM pour les devis signés ──
export type CrmSignedQuote = {
  crmId: string               // ID unique côté CRM
  quoteReference: string      // Correspond au champ `reference` du calculateur
  clientName?: string
  signedAt?: string           // ISO date
}
