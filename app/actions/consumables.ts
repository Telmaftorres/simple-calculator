'use server'

import { z } from 'zod'
import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'
import { revalidateCache } from '@/lib/server/cache'
import { unstable_cache } from 'next/cache'

const consumableSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  price: z.number().positive('Le prix doit être positif'),
  size: z.number().positive('La taille doit être positive'),
})

const getConsumablesLocal = unstable_cache(
  async () => prisma.consumable.findMany({ orderBy: { name: 'asc' } }),
  ['consumables'],
  { tags: ['consumables'] }
)

export async function getConsumables() {
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
        return (data as { id: number | string; name: string; price: number; size: number }[])
          .map((c, i) => ({ id: typeof c.id === 'number' ? c.id : i + 1, name: c.name, price: c.price, size: c.size }))
      }
    } catch { /* fallback local */ }
  }
  return getConsumablesLocal()
}

export async function createConsumable(data: z.infer<typeof consumableSchema>) {
  await requireAuth()
  const validated = consumableSchema.parse(data)
  await prisma.consumable.create({ data: validated })
  revalidatePath('/dashboard/consumables')
  revalidateCache('consumables')
}

export async function updateConsumable(id: number, data: z.infer<typeof consumableSchema>) {
  await requireAuth()
  const validated = consumableSchema.parse(data)
  await prisma.consumable.update({ where: { id }, data: validated })
  revalidatePath('/dashboard/consumables')
  revalidateCache('consumables')
}

export async function deleteConsumable(id: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  await prisma.consumable.delete({ where: { id: validId } })
  revalidatePath('/dashboard/consumables')
  revalidateCache('consumables')
}
