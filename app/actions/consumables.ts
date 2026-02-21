'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'

// ────────────────────────────────────────────────────
// Schema de validation
// ────────────────────────────────────────────────────

const consumableSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  price: z.number().positive('Le prix doit être positif'),
  size: z.number().positive('La taille (en mètres ou cm) doit être positive'),
})

// ────────────────────────────────────────────────────
// Helper : vérification d'authentification
// ────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth()
  if (!session?.user) throw new Error('Non autorisé')
  if (session.user.role !== 'ADMIN') throw new Error('Accès refusé')
  return session
}

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
  await requireAuth()
  const validated = consumableSchema.parse(data)
  await prisma.consumable.create({ data: validated })
  revalidatePath('/dashboard/consumables')
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('consumables')
}

export async function updateConsumable(id: number, data: z.infer<typeof consumableSchema>) {
  await requireAuth()
  const validated = consumableSchema.parse(data)
  await prisma.consumable.update({ where: { id }, data: validated })
  revalidatePath('/dashboard/consumables')
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('consumables')
}

export async function deleteConsumable(id: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  await prisma.consumable.delete({ where: { id: validId } })
  revalidatePath('/dashboard/consumables')
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('consumables')
}
