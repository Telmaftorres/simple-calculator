'use server'

import { prisma } from '@/lib/server/prisma'
import { requireAdmin } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAction } from '@/lib/server/audit'
import { auth } from '@/auth'

export async function getSettings(companyId: number) {
  return await prisma.setting.findMany({
    where: { companyId },
    orderBy: { key: 'asc' },
  })
}

export async function getSettingsMap(companyId: number): Promise<Record<string, number>> {
  const settings = await getSettings(companyId)
  return Object.fromEntries(
    settings.map((s) => [s.key, parseFloat(s.value)])
  )
}

export async function updateSetting(key: string, value: string) {
  const session = await requireAdmin()

  const validated = z.object({
    key: z.string().min(1),
    value: z.string().refine(
      (v) => !isNaN(parseFloat(v)) && isFinite(Number(v)),
      { message: 'La valeur doit être un nombre valide' }
    ),
  }).parse({ key, value })

  const companyId = session.user.companyId
  if (!companyId) throw new Error('Aucune company associée')

  await prisma.setting.update({
    where: { key_companyId: { key: validated.key, companyId } },
    data: {
      value: validated.value,
      updatedAt: new Date(),
    },
  })

  await logAction({
    userId: session?.user?.id,
    userName: session?.user?.name ?? session?.user?.email,
    action: 'UPDATE_SETTING',
    entityType: 'Setting',
    entityRef: validated.key,
    details: { value: validated.value },
  })

  revalidatePath('/settings/calculator')
}
