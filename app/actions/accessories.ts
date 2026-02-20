'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'

// ────────────────────────────────────────────────────
// Schema de validation
// ────────────────────────────────────────────────────

const accessorySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  price: z.number().positive('Le prix doit être positif'),
  supplier: z.string().optional(),
  weight: z.number().positive().optional(),
})

// ────────────────────────────────────────────────────
// Helper : vérification d'authentification
// ────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth()
  if (!session?.user) throw new Error('Non autorisé')
  return session
}

// ────────────────────────────────────────────────────
// Lecture (tous les connectés)
// ────────────────────────────────────────────────────

export const getAccessories = unstable_cache(
  async () => {
    return await prisma.accessory.findMany({
      orderBy: { name: 'asc' },
    })
  },
  ['accessories'],
  { tags: ['accessories'] }
)

// ────────────────────────────────────────────────────
// Mutations (tous les connectés)
// ────────────────────────────────────────────────────

export async function createAccessory(data: z.infer<typeof accessorySchema>) {
  await requireAuth()
  const validated = accessorySchema.parse(data)
  await prisma.accessory.create({ data: validated })
  revalidatePath('/dashboard/accessories')
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('accessories')
}

export async function updateAccessory(id: number, data: z.infer<typeof accessorySchema>) {
  await requireAuth()
  const validated = accessorySchema.parse(data)
  await prisma.accessory.update({ where: { id }, data: validated })
  revalidatePath('/dashboard/accessories')
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('accessories')
}

export async function deleteAccessory(id: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  await prisma.accessory.delete({ where: { id: validId } })
  revalidatePath('/dashboard/accessories')
  // @ts-expect-error - Next.js type mismatch
  revalidateTag('accessories')
}
