'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'
import { revalidateCache } from '@/lib/cache'

// ────────────────────────────────────────────────────
// Schema de validation
// ────────────────────────────────────────────────────

const consumableSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  price: z.number().positive('Le prix doit être positif'),
  size: z.number().positive('La taille (en mètres ou cm) doit être positive'),
})

// ────────────────────────────────────────────────────
// Lecture (tous les connectés)
// ────────────────────────────────────────────────────

export const getConsumables = unstable_cache(
  async () => {
    return await prisma.consumable.findMany({
      orderBy: { name: 'asc' },
    })
  },
  ['consumables'],
  { tags: ['consumables'] }
)

// ────────────────────────────────────────────────────
// Mutations (Admin seulement)
// ────────────────────────────────────────────────────

export async function createConsumable(data: z.infer<typeof consumableSchema>) {
  await requireAdmin()
  const validated = consumableSchema.parse(data)
  await prisma.consumable.create({ data: validated })
  revalidatePath('/dashboard/consumables')
  revalidateCache('consumables')
}

export async function updateConsumable(id: number, data: z.infer<typeof consumableSchema>) {
  await requireAdmin()
  const validated = consumableSchema.parse(data)
  await prisma.consumable.update({ where: { id }, data: validated })
  revalidatePath('/dashboard/consumables')
  revalidateCache('consumables')
}

export async function deleteConsumable(id: number) {
  await requireAdmin()
  const validId = z.number().int().positive().parse(id)
  await prisma.consumable.delete({ where: { id: validId } })
  revalidatePath('/dashboard/consumables')
  revalidateCache('consumables')
}
