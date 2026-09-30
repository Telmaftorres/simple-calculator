import type { PrismaClient, Plate } from '@prisma/client'

export type CrmPlateInput = {
  crmMaterialId: string
  name: string
  width: number
  height: number
  cost: number
  stockRemaining: number
}

export type SyncedPlate = Omit<Plate, 'companyId'> & { companyId: number; stockRemaining?: number }

// Les devis enregistrent comme plateId l'id_matiere du CRM (c'est l'id que le calculateur a
// toujours proposé). La ligne Plate locale portant ce même id doit donc contenir CETTE matière
// (nom, dimensions, prix) : sinon devis, fiche de prod et calculateur n'affichent pas la même.
// La catégorie emballage n'est jamais écrasée. Renvoie aussi les autres plaques de l'entreprise,
// que des devis existants peuvent référencer.
export async function syncCrmPlates(prisma: PrismaClient, cid: number, items: CrmPlateInput[]): Promise<SyncedPlate[]> {
  const local = await prisma.plate.findMany({ where: { companyId: cid } })
  const byId = new Map(local.map(p => [p.id, p]))
  let createdWithExplicitId = false
  const synced: SyncedPlate[] = []

  for (const it of items) {
    const { crmMaterialId, name, width, height, cost, stockRemaining } = it
    const idNum = Number(crmMaterialId)
    const validId = Number.isInteger(idNum) && idNum > 0
    // Ne jamais écraser une dimension ou un prix existant par 0 (format/prix CRM illisible)
    const freshData: { width?: number; height?: number; cost?: number } = {
      ...(width > 0 ? { width } : {}),
      ...(height > 0 ? { height } : {}),
      ...(cost > 0 ? { cost } : {}),
    }
    const displayOnly: SyncedPlate = {
      id: idNum, companyId: cid, name, width, height, cost, material: '',
      packagingCategory: null, crmMaterialId, stockRemaining,
    }

    try {
      if (!validId) { synced.push(displayOnly); continue }

      // Libère l'identifiant CRM et le nom s'ils sont portés par une autre ligne (doublons)
      for (const p of local) {
        if (p.id === idNum) continue
        if (p.crmMaterialId === crmMaterialId) {
          await prisma.plate.update({ where: { id: p.id }, data: { crmMaterialId: null } })
          p.crmMaterialId = null
        }
        if (p.name === name) {
          const renamed = `${p.name} (#${p.id})`
          await prisma.plate.update({ where: { id: p.id }, data: { name: renamed } })
          p.name = renamed
        }
      }

      const target = byId.get(idNum)
      if (target) {
        const needsUpdate = target.name !== name || target.crmMaterialId !== crmMaterialId
          || (freshData.width !== undefined && target.width !== freshData.width)
          || (freshData.height !== undefined && target.height !== freshData.height)
          || (freshData.cost !== undefined && target.cost !== freshData.cost)
        const plate = needsUpdate
          ? await prisma.plate.update({ where: { id: idNum }, data: { name, crmMaterialId, ...freshData } })
          : target
        Object.assign(target, plate)
        synced.push({ ...plate, stockRemaining })
        continue
      }

      const takenElsewhere = await prisma.plate.findUnique({ where: { id: idNum }, select: { id: true } })
      if (takenElsewhere) { synced.push(displayOnly); continue }

      const plate = await prisma.plate.create({
        data: { id: idNum, companyId: cid, crmMaterialId, name, width, height, cost, material: '' },
      })
      createdWithExplicitId = true
      byId.set(idNum, plate)
      local.push(plate)
      synced.push({ ...plate, stockRemaining })
    } catch (e) {
      console.error('[syncCrmPlates]', crmMaterialId, e)
      synced.push(displayOnly)
    }
  }

  if (createdWithExplicitId) {
    // Les ids ont été forcés : on recale la séquence pour les futures créations
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Plate"', 'id'), (SELECT MAX(id) FROM "Plate"))`)
  }

  const syncedIds = new Set(synced.map(p => p.id))
  const others = local
    .filter(p => !syncedIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name))
  return [...synced, ...others]
}
