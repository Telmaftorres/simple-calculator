'use server'

import { prisma } from '@/lib/server/prisma'
import { requireAdmin } from '@/lib/server/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAction } from '@/lib/server/audit'
import { auth } from '@/auth'
import {
  HOURLY_RATE_PRINT_COST,
  HOURLY_RATE_CUTTING_COST,
  HOURLY_RATE_ASSEMBLY_COST,
  HOURLY_RATE_CONDITIONING_COST,
  HOURLY_RATE_PACKAGING_COST,
  HOURLY_RATE_BE_COST,
  HOURLY_RATE_BAT_COST,
} from '@/lib/config/pricing'

// Réglages « coûtants » (brut) — ajoutés après coup, peuvent manquer en base.
const COST_RATE_SETTINGS = [
  { key: 'HOURLY_RATE_PRINT_COST', value: String(HOURLY_RATE_PRINT_COST), label: 'Taux horaire impression (coûtant)', unit: '€/h' },
  { key: 'HOURLY_RATE_CUTTING_COST', value: String(HOURLY_RATE_CUTTING_COST), label: 'Taux horaire découpe (coûtant)', unit: '€/h' },
  { key: 'HOURLY_RATE_ASSEMBLY_COST', value: String(HOURLY_RATE_ASSEMBLY_COST), label: 'Taux horaire façonnage (coûtant)', unit: '€/h' },
  { key: 'HOURLY_RATE_CONDITIONING_COST', value: String(HOURLY_RATE_CONDITIONING_COST), label: 'Taux horaire conditionnement (coûtant)', unit: '€/h' },
  { key: 'HOURLY_RATE_PACKAGING_COST', value: String(HOURLY_RATE_PACKAGING_COST), label: 'Taux horaire emballage (coûtant)', unit: '€/h' },
  { key: 'HOURLY_RATE_BE_COST', value: String(HOURLY_RATE_BE_COST), label: "Taux horaire Bureau d'études (coûtant)", unit: '€/h' },
  { key: 'HOURLY_RATE_BAT_COST', value: String(HOURLY_RATE_BAT_COST), label: 'Taux horaire BAT (coûtant)', unit: '€/h' },
]

/**
 * Crée les réglages « coûtants » manquants pour une company (INSERT uniquement,
 * jamais de modif/suppression). Idempotent : ne touche pas aux valeurs existantes.
 */
export async function ensureCostRateSettings(companyId: number): Promise<void> {
  const keys = COST_RATE_SETTINGS.map((s) => s.key)
  const existing = await prisma.setting.findMany({
    where: { companyId, key: { in: keys } },
    select: { key: true },
  })
  const have = new Set(existing.map((e) => e.key))
  const toCreate = COST_RATE_SETTINGS.filter((s) => !have.has(s.key)).map((s) => ({ ...s, companyId }))
  if (toCreate.length > 0) {
    await prisma.setting.createMany({ data: toCreate, skipDuplicates: true })
  }
}

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
