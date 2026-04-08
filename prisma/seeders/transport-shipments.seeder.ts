import { PrismaClient } from '@prisma/client'
import { TRANSPORT_SHIPMENTS_DATA } from './data/transport-shipments.data'

export async function seedTransportShipments(prisma: PrismaClient): Promise<void> {
  console.log('🚚 Seeding transport shipments...')

  let created = 0
  let skipped = 0

  for (const entry of TRANSPORT_SHIPMENTS_DATA) {
    const existing = await prisma.transportShipment.findFirst({
      where: {
        clientName:    entry.clientName,
        department:    entry.department,
        weightKg:      entry.weightKg,
        transportMode: entry.transportMode,
      },
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.transportShipment.create({ data: entry })
    created++
  }

  console.log(`✅ Transport shipments: ${created} created, ${skipped} skipped`)
}
