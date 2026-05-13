'use server'

import { z } from 'zod'
import { prisma } from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'
import { revalidateCache } from '@/lib/server/cache'
import { unstable_cache } from 'next/cache'

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

export const getAccessories = unstable_cache(
  async () => prisma.accessory.findMany({ orderBy: { name: 'asc' } }),
  ['accessories'],
  { tags: ['accessories'] }
)

export async function createAccessory(data: z.infer<typeof accessorySchema>) {
  await requireAuth()
  const validated = accessorySchema.parse(data)
  const accessory = await prisma.accessory.create({ data: validated })
  revalidatePath('/dashboard/accessories')
  revalidateCache('accessories')
  return accessory
}

export async function updateAccessory(id: number, data: z.infer<typeof accessorySchema>) {
  await requireAuth()
  const validated = accessorySchema.parse(data)
  await prisma.accessory.update({ where: { id }, data: validated })
  revalidatePath('/dashboard/accessories')
  revalidateCache('accessories')
}

export async function deleteAccessory(id: number) {
  await requireAuth()
  const validId = z.number().int().positive().parse(id)
  await prisma.accessory.delete({ where: { id: validId } })
  revalidatePath('/dashboard/accessories')
  revalidateCache('accessories')
}
