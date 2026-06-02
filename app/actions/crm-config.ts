'use server'

import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CRM_URL_KEY = 'CRM_API_URL'

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

export async function testCrmConnection(url: string): Promise<{ ok: boolean; message: string }> {
  await requireAuth()
  const trimmed = url.trim().replace(/\/$/, '')
  try {
    const res = await fetch(`${trimmed}/accessoires`, {
      signal: AbortSignal.timeout(5000),
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return { ok: false, message: `Erreur HTTP ${res.status}` }
    await res.json()
    return { ok: true, message: 'Connexion réussie ✓' }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, message: `Impossible de joindre le CRM : ${msg}` }
  }
}

// Format attendu du CRM pour les accessoires
export type CrmAccessory = { id: number | string; name: string; price: number; description?: string }
// Format attendu du CRM pour les matières/plaques
export type CrmPlate = { id: number | string; name: string; width: number; height: number; cost: number; material?: string }
