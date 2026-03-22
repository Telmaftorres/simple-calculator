'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { revalidateCache } from '@/lib/cache'
import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'
import { z } from 'zod'

export const getSettings = unstable_cache(
  async () => {
    return await prisma.setting.findMany({
      orderBy: { key: 'asc' },
    })
  },
  ['settings'],
  { tags: ['settings'] }
)

export async function getSettingsMap(): Promise<Record<string, number>> {
  const settings = await getSettings()
  return Object.fromEntries(
    settings.map((s) => [s.key, parseFloat(s.value)])
  )
}

export async function updateSetting(key: string, value: string) {
  await requireAdmin()

  const validated = z.object({
    key: z.string().min(1),
    value: z.string().refine(
      (v) => !isNaN(parseFloat(v)) && isFinite(Number(v)),
      { message: 'La valeur doit être un nombre valide' }
    ),
  }).parse({ key, value })

  await prisma.setting.update({
    where: { key: validated.key },
    data: {
      value: validated.value,
      updatedAt: new Date(),
    },
  })

  revalidateCache('settings') 
  revalidatePath('/settings/calculator')
}