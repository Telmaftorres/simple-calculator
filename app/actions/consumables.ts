'use server'

import { z } from 'zod'
import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'
import { revalidateCache } from '@/lib/server/cache'

const consumableSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  price: z.number().positive('Le prix doit être positif'),
  size: z.number().positive('La taille doit être positive'),
})

export async function getConsumables(companyId: number) {
  const { getCrmApiUrl, getCrmHeaders } = await import('./crm-config')
  const crmUrl = await getCrmApiUrl()
  if (crmUrl) {
    try {
      const headers = await getCrmHeaders()
      const res = await fetch(`${crmUrl.replace(/\/$/, '')}/consommables`, {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 60 },
        headers,
      })
      if (res.ok) {
        const data = await res.json()
        return (data as { id: number | string; name: string; price: number; size?: number }[])
          .map((c, i) => ({ id: typeof c.id === 'number' ? c.id : i + 1, name: c.name, price: c.price, size: c.size ?? 1 }))
      }
    } catch { /* fallback local */ }
  }
  return prisma.consumable.findMany({ where: { companyId }, orderBy: { name: 'asc' } })
}

export async function createConsumable(data: z.infer<typeof consumableSchema>) {
  const session = await requireAuth()
  const companyId = session.user.companyId
  if (!companyId) throw new Error('Aucune company associée')
  const validated = consumableSchema.parse(data)
  await prisma.consumable.create({ data: { ...validated, companyId } })
  revalidatePath('/dashboard/consumables')
  revalidateCache('consumables')
}

export async function updateConsumable(id: number, data: z.infer<typeof consumableSchema>) {
  const session = await requireAuth()
  const companyId = session.user.companyId
  if (!companyId) throw new Error('Aucune company associée')
  const validated = consumableSchema.parse(data)
  await prisma.consumable.update({ where: { id, companyId }, data: validated })
  revalidatePath('/dashboard/consumables')
  revalidateCache('consumables')
}

export async function deleteConsumable(id: number) {
  const session = await requireAuth()
  const companyId = session.user.companyId
  if (!companyId) throw new Error('Aucune company associée')
  const validId = z.number().int().positive().parse(id)
  await prisma.consumable.delete({ where: { id: validId, companyId } })
  revalidatePath('/dashboard/consumables')
  revalidateCache('consumables')
}
