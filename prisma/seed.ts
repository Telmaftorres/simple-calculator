import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { seedSettings, seedTransportShipments, seedPackagingPricing } from './seeders'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
})

async function main() {
  console.log('Seeding database...')

  const seedPassword = process.env.SEED_ADMIN_PASSWORD
  if (!seedPassword) throw new Error('SEED_ADMIN_PASSWORD non défini dans .env')

  // 1. Studies
  const study1 = await prisma.study.upsert({
    where: { number: 'E-2024-001' },
    update: {},
    create: { number: 'E-2024-001', name: 'Campagne Été 2024' },
  })

  // 2. Product Types
  const productType1 = await prisma.productType.upsert({
    where: { name: 'PRESENTOIR DE COMPTOIR' },
    update: { flatWidthFormula: '100 + l + L + l', flatHeightFormula: '100 + H + l + 100' },
    create: {
      name: 'PRESENTOIR DE COMPTOIR',
      flatWidthFormula: '100 + l + L + l',
      flatHeightFormula: '100 + H + l + 100',
      elements: {
        create: [
          { name: 'Corps', quantity: 1 },
          { name: 'Fronton', quantity: 1 },
          { name: 'Socle', quantity: 1 },
        ],
      },
    },
  })

  const productType2 = await prisma.productType.upsert({
    where: { name: 'PRESENTOIR DE SOL' },
    update: { flatWidthFormula: 'l', flatHeightFormula: 'L' },
    create: {
      name: 'PRESENTOIR DE SOL',
      flatWidthFormula: 'l',
      flatHeightFormula: 'L',
      elements: {
        create: [
          { name: 'Structure principale', quantity: 1 },
          { name: 'Header', quantity: 1 },
          { name: 'Base', quantity: 1 },
          { name: 'Etagère', quantity: 3 },
        ],
      },
    },
  })

  // 3. Plates
  const akylux = await prisma.plate.upsert({ where: { name: 'Akylux 3mm 1200x1600' }, update: {}, create: { name: 'Akylux 3mm 1200x1600', width: 1200, height: 1600, cost: 6.12, material: 'Akylux 3mm' } })
  const bc30 = await prisma.plate.upsert({ where: { name: 'BC 30 2 brun 1700x2100' }, update: {}, create: { name: 'BC 30 2 brun 1700x2100', width: 1700, height: 2100, cost: 2.44, material: 'BC 30 2 brun' } })
  const ee1700 = await prisma.plate.upsert({ where: { name: 'EE 1C/1B (20S1G1W) 1700x2100' }, update: {}, create: { name: 'EE 1C/1B (20S1G1W) 1700x2100', width: 1700, height: 2100, cost: 4.73, material: 'EE 1C/1B (20S1G1W)' } })
  const ee2000 = await prisma.plate.upsert({ where: { name: 'EE 1C/1B (20S1G1W) 2000x2500' }, update: {}, create: { name: 'EE 1C/1B (20S1G1W) 2000x2500', width: 2000, height: 2500, cost: 6.83, material: 'EE 1C/1B (20S1G1W)' } })
  const pvc5mm = await prisma.plate.upsert({ where: { name: 'PVC 5mm 2050x1525' }, update: {}, create: { name: 'PVC 5mm 2050x1525', width: 2050, height: 1525, cost: 23.62, material: 'PVC 5mm' } })
  const pvc500 = await prisma.plate.upsert({ where: { name: 'PVC 500 microns 1000x1400' }, update: {}, create: { name: 'PVC 500 microns 1000x1400', width: 1000, height: 1400, cost: 5.82, material: 'PVC 500 microns' } })
  const pvc3mm = await prisma.plate.upsert({ where: { name: 'PVC 3mm 2440x1220' }, update: {}, create: { name: 'PVC 3mm 2440x1220', width: 2440, height: 1220, cost: 15.55, material: 'PVC 3mm' } })
  const pvc300 = await prisma.plate.upsert({ where: { name: 'PVC 300 microns 1000x1400' }, update: {}, create: { name: 'PVC 300 microns 1000x1400', width: 1000, height: 1400, cost: 3.42, material: 'PVC 300 microns' } })
  const pvc700 = await prisma.plate.upsert({ where: { name: 'PVC 700 microns 1000x1400' }, update: {}, create: { name: 'PVC 700 microns 1000x1400', width: 1000, height: 1400, cost: 8.2, material: 'PVC 700 microns' } })
  
  // Nouvelles matières ajoutées depuis l'audit
  const bc30_2200 = await prisma.plate.upsert({ where: { name: 'BC 30 2 bruns (BCTT74A) 1700x2200' }, update: {}, create: { name: 'BC 30 2 bruns (BCTT74A) 1700x2200', width: 1700, height: 2200, cost: 2.48, material: 'BC 30 2 bruns (BCTT74A)' } })
  const c5tt52a = await prisma.plate.upsert({ where: { name: 'C (C5TT52A) 1700x2100' }, update: {}, create: { name: 'C (C5TT52A) 1700x2100', width: 1700, height: 2100, cost: 1.91, material: 'C (C5TT52A)' } })
  const carte300 = await prisma.plate.upsert({ where: { name: 'Carte 300 gr 720x1020' }, update: {}, create: { name: 'Carte 300 gr 720x1020', width: 720, height: 1020, cost: 0.69, material: 'Carte 300 gr' } })
  const carte350 = await prisma.plate.upsert({ where: { name: 'Carte 350 gr couche 1 face 800x1200' }, update: {}, create: { name: 'Carte 350 gr couche 1 face 800x1200', width: 800, height: 1200, cost: 1.71, material: 'Carte 350 gr couche 1 face' } })
  const carte400 = await prisma.plate.upsert({ where: { name: 'Carte 400 gr couché 2 blanc 800x1200' }, update: {}, create: { name: 'Carte 400 gr couché 2 blanc 800x1200', width: 800, height: 1200, cost: 1.23, material: 'Carte 400 gr couché 2 blanc' } })
  const compact1019 = await prisma.plate.upsert({ where: { name: 'Compact 10/19 1200x1600' }, update: {}, create: { name: 'Compact 10/19 1200x1600', width: 1200, height: 1600, cost: 7.55, material: 'Compact 10/19' } })
  const e1c1b11s1w = await prisma.plate.upsert({ where: { name: 'E 1C/1B (11S1W) 1700x2100' }, update: {}, create: { name: 'E 1C/1B (11S1W) 1700x2100', width: 1700, height: 2100, cost: 3.06, material: 'E 1C/1B (11S1W)' } })
  const ee1kraft = await prisma.plate.upsert({ where: { name: 'EE 1 kraft brun / 1 brun 1700x2100' }, update: {}, create: { name: 'EE 1 kraft brun / 1 brun 1700x2100', width: 1700, height: 2100, cost: 4.19, material: 'EE 1 kraft brun / 1 brun' } })
  const ee2c20w1g1w = await prisma.plate.upsert({ where: { name: 'EE 2C (20W1G1W) 1700x2100' }, update: {}, create: { name: 'EE 2C (20W1G1W) 1700x2100', width: 1700, height: 2100, cost: 5.62, material: 'EE 2C (20W1G1W)' } })
  const pet05 = await prisma.plate.upsert({ where: { name: 'PET transparent 0,5mm 2050x1250' }, update: {}, create: { name: 'PET transparent 0,5mm 2050x1250', width: 2050, height: 1250, cost: 0.00, material: 'PET transparent 0,5mm' } })
  const priplak = await prisma.plate.upsert({ where: { name: 'PRIPLAK blanc 1200 microns 800x1200' }, update: {}, create: { name: 'PRIPLAK blanc 1200 microns 800x1200', width: 800, height: 1200, cost: 2.00, material: 'PRIPLAK blanc 1200 microns' } })
  const pvc1mm = await prisma.plate.upsert({ where: { name: 'PVC 1 mm 2440x1220' }, update: {}, create: { name: 'PVC 1 mm 2440x1220', width: 2440, height: 1220, cost: 15.62, material: 'PVC 1 mm' } })
  const vinyladhesif = await prisma.plate.upsert({ where: { name: 'Vinyl adhesif transparent 1000x700' }, update: {}, create: { name: 'Vinyl adhesif transparent 1000x700', width: 1000, height: 700, cost: 1.70, material: 'Vinyl adhesif transparent' } })

  console.log('Seeded new plates:', [bc30_2200, c5tt52a, carte300, carte350, carte400, compact1019, e1c1b11s1w, ee1kraft, ee2c20w1g1w, pet05, priplak, pvc1mm, vinyladhesif].map(p => p.name))

  console.log({ study1, productType1, productType2, akylux, bc30, ee1700, ee2000, pvc5mm, pvc500, pvc3mm, pvc300, pvc700 })

  // 4. Admin User
  const passwordHash = await bcrypt.hash(seedPassword, 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kontfeel.fr' },
    update: { password: passwordHash, role: 'ADMIN', permissions: ['MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_SETTINGS'] },
    create: { email: 'admin@kontfeel.fr', name: 'Admin', firstName: 'Admin', lastName: 'System', password: passwordHash, mustChangePassword: true, role: 'ADMIN', permissions: ['MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_SETTINGS'] },
  })
  console.log({ admin })

  // 5. Accessories
  const accessories = [
    { name: 'Grip Magnétique', description: '75mm', price: 1.82, supplier: 'Caractères', weight: 76 },
    { name: 'Potence magnétique', description: '250mm / 2 crochets mobiles', price: 1.85, supplier: 'Caractères', weight: 155 },
  ]
  for (const acc of accessories) {
    const existing = await prisma.accessory.findFirst({
      where: { name: acc.name },
    })
    if (!existing) {
      await prisma.accessory.create({ data: acc })
    }
  }
  console.log('Seeded accessories:', accessories.map(a => a.name))

  // 6. Settings
  await seedSettings(prisma)

  // 7. Transport Shipments
  await seedTransportShipments(prisma)

  // 8. Packaging Pricing
  await seedPackagingPricing(prisma)

  console.log('✅ Seed terminé avec succès !')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })