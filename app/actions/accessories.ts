'use server'

import { z } from 'zod'
import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'
import { revalidateCache } from '@/lib/server/cache'

const accessorySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  price: z.number().positive('Le prix doit être positif'),
  supplier: z.string().optional(),
  supplierRef: z.string().optional(),
  supplierUrl: z.string().optional(),
  lotSize: z.number().int().positive().optional(),
  imageUrl: z.string().optional(),
  weight: z.number().positive().optional(),
})

export async function getAccessories(companyId?: number) {
  const cid = companyId ?? (await requireAuth()).user.companyId ?? 0
  const { getCrmApiUrl, getCrmHeaders } = await import('./crm-config')
  const crmUrl = await getCrmApiUrl()
  if (crmUrl) {
    try {
      const headers = await getCrmHeaders()
      const res = await fetch(`${crmUrl.replace(/\/$/, '')}/accessoires`, {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 60 },
        headers,
      })
      if (res.ok) {
        const data = await res.json()
        return (data as { id: number | string; name: string; price: number; description?: string }[])
          .map((a, i) => ({ id: typeof a.id === 'number' ? a.id : i + 1, name: a.name, price: a.price, description: a.description ?? null, supplier: null, supplierRef: null, supplierUrl: null, lotSize: null, imageUrl: null, weight: null, createdAt: new Date(), updatedAt: new Date() }))
      }
    } catch { /* fallback local */ }
  }
  return prisma.accessory.findMany({ where: { companyId: cid }, orderBy: { name: 'asc' } })
}

export async function createAccessory(data: z.infer<typeof accessorySchema>) {
  const session = await requireAuth()
  const companyId = session.user.companyId
  if (!companyId) throw new Error('Aucune company associée')
  const validated = accessorySchema.parse(data)
  const accessory = await prisma.accessory.create({ data: { ...validated, companyId } })
  revalidatePath('/dashboard/accessories')
  revalidateCache('accessories')
  return accessory
}

export async function updateAccessory(id: number, data: z.infer<typeof accessorySchema>) {
  const session = await requireAuth()
  const companyId = session.user.companyId
  if (!companyId) throw new Error('Aucune company associée')
  const validated = accessorySchema.parse(data)
  await prisma.accessory.update({ where: { id, companyId }, data: validated })
  revalidatePath('/dashboard/accessories')
  revalidateCache('accessories')
}

export async function deleteAccessory(id: number) {
  const session = await requireAuth()
  const companyId = session.user.companyId
  if (!companyId) throw new Error('Aucune company associée')
  const validId = z.number().int().positive().parse(id)
  await prisma.accessory.delete({ where: { id: validId, companyId } })
  revalidatePath('/dashboard/accessories')
  revalidateCache('accessories')
}
