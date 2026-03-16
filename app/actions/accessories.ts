'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { revalidatePath } from 'next/cache'
import { revalidateCache } from '@/lib/cache'

const accessorySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  price: z.number().positive('Le prix doit être positif'),
  supplier: z.string().optional(),
  weight: z.number().positive().optional(),
})

export const getAccessories = async () => {
  return await prisma.accessory.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function createAccessory(data: z.infer<typeof accessorySchema>) {
  await requireAuth()
  const validated = accessorySchema.parse(data)
  await prisma.accessory.create({ data: validated })
  revalidatePath('/dashboard/accessories')
  revalidateCache('accessories')
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
