import type { Prisma } from '@prisma/client'

export const TRANSPORT_SHIPMENTS_DATA: Prisma.TransportShipmentCreateInput[] = [
  {
    clientName:    'HAVEA',
    plvType:       'Présentoir de comptoir',
    plvFormat:     '105x128x230mm',
    quantity:      1,
    transportMode: 'PACK30',
    department:    '75',
    weightKg:      7,
    units:         1,
    basePriceHT:   12.88,
    optionsHT:     3.40,
    totalHT:       16.28,
    notes:         'Prototype',
  },
]
