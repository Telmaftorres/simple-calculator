'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { revalidatePath } from 'next/cache'
import { revalidateCache } from '@/lib/cache'

const consumableSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  price: z.number().positive('Le prix doit être positif'),
  size: z.number().positive('La taille doit être positive'),
})

export const getConsumables = async () => {
  return await prisma.consumable.findMany({
    orderBy: { name: 'asc' },
  })
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