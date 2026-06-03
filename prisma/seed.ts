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

  // 0. Company Kontfeel
  const kontfeel = await prisma.company.upsert({
    where: { slug: 'kontfeel' },
    update: {},
    create: { name: 'Kontfeel', slug: 'kontfeel' },
  })
  const companyId = kontfeel.id

  // 1. Studies
  const study1 = await prisma.study.upsert({
    where: { number_companyId: { number: 'E-2024-001', companyId } },
    update: {},
    create: { number: 'E-2024-001', name: 'Campagne Été 2024', companyId },
  })

  // 2. Product Types
  const productType1 = await prisma.productType.upsert({
    where: { name_companyId: { name: 'PRESENTOIR DE COMPTOIR', companyId } },
    update: { flatWidthFormula: '100 + l + L + l', flatHeightFormula: '100 + H + l + 100' },
    create: {
      name: 'PRESENTOIR DE COMPTOIR',
      flatWidthFormula: '100 + l + L + l',
      flatHeightFormula: '100 + H + l + 100',
      companyId,
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
    where: { name_companyId: { name: 'PRESENTOIR DE SOL', companyId } },
    update: { flatWidthFormula: 'l', flatHeightFormula: 'L' },
    create: {
      name: 'PRESENTOIR DE SOL',
      flatWidthFormula: 'l',
      flatHeightFormula: 'L',
      companyId,
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
  const plateUpsert = (name: string, width: number, height: number, cost: number, material: string) =>
    prisma.plate.upsert({
      where: { name_companyId: { name, companyId } },
      update: {},
      create: { name, width, height, cost, material, companyId },
    })

  const akylux = await plateUpsert('Akylux 3mm 1200x1600', 1200, 1600, 6.12, 'Akylux 3mm')
  const bc30 = await plateUpsert('BC 30 2 brun 1700x2100', 1700, 2100, 2.44, 'BC 30 2 brun')
  const ee1700 = await plateUpsert('EE 1C/1B (20S1G1W) 1700x2100', 1700, 2100, 4.73, 'EE 1C/1B (20S1G1W)')
  const ee2000 = await plateUpsert('EE 1C/1B (20S1G1W) 2000x2500', 2000, 2500, 6.83, 'EE 1C/1B (20S1G1W)')
  const pvc5mm = await plateUpsert('PVC 5mm 2050x1525', 2050, 1525, 23.62, 'PVC 5mm')
  const pvc500 = await plateUpsert('PVC 500 microns 1000x1400', 1000, 1400, 5.82, 'PVC 500 microns')
  const pvc3mm = await plateUpsert('PVC 3mm 2440x1220', 2440, 1220, 15.55, 'PVC 3mm')
  const pvc300 = await plateUpsert('PVC 300 microns 1000x1400', 1000, 1400, 3.42, 'PVC 300 microns')
  const pvc700 = await plateUpsert('PVC 700 microns 1000x1400', 1000, 1400, 8.2, 'PVC 700 microns')

  // Nouvelles matières ajoutées depuis l'audit
  const bc30_2200 = await plateUpsert('BC 30 2 bruns (BCTT74A) 1700x2200', 1700, 2200, 2.48, 'BC 30 2 bruns (BCTT74A)')
  const c5tt52a = await plateUpsert('C (C5TT52A) 1700x2100', 1700, 2100, 1.91, 'C (C5TT52A)')
  const carte300 = await plateUpsert('Carte 300 gr 720x1020', 720, 1020, 0.69, 'Carte 300 gr')
  const carte350 = await plateUpsert('Carte 350 gr couche 1 face 800x1200', 800, 1200, 1.71, 'Carte 350 gr couche 1 face')
  const carte400 = await plateUpsert('Carte 400 gr couché 2 blanc 800x1200', 800, 1200, 1.23, 'Carte 400 gr couché 2 blanc')
  const compact1019 = await plateUpsert('Compact 10/19 1200x1600', 1200, 1600, 7.55, 'Compact 10/19')
  const e1c1b11s1w = await plateUpsert('E 1C/1B (11S1W) 1700x2100', 1700, 2100, 3.06, 'E 1C/1B (11S1W)')
  const ee1kraft = await plateUpsert('EE 1 kraft brun / 1 brun 1700x2100', 1700, 2100, 4.19, 'EE 1 kraft brun / 1 brun')
  const ee2c20w1g1w = await plateUpsert('EE 2C (20W1G1W) 1700x2100', 1700, 2100, 5.62, 'EE 2C (20W1G1W)')
  const pet05 = await plateUpsert('PET transparent 0,5mm 2050x1250', 2050, 1250, 0.00, 'PET transparent 0,5mm')
  const priplak = await plateUpsert('PRIPLAK blanc 1200 microns 800x1200', 800, 1200, 2.00, 'PRIPLAK blanc 1200 microns')
  const pvc1mm = await plateUpsert('PVC 1 mm 2440x1220', 2440, 1220, 15.62, 'PVC 1 mm')
  const vinyladhesif = await plateUpsert('Vinyl adhesif transparent 1000x700', 1000, 700, 1.70, 'Vinyl adhesif transparent')

  console.log('Seeded new plates:', [bc30_2200, c5tt52a, carte300, carte350, carte400, compact1019, e1c1b11s1w, ee1kraft, ee2c20w1g1w, pet05, priplak, pvc1mm, vinyladhesif].map(p => p.name))

  console.log({ study1, productType1, productType2, akylux, bc30, ee1700, ee2000, pvc5mm, pvc500, pvc3mm, pvc300, pvc700 })

  // 4. Admin User
  const passwordHash = await bcrypt.hash(seedPassword, 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kontfeel.fr' },
    update: { password: passwordHash, role: 'ADMIN', permissions: ['MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_SETTINGS'] },
    create: { email: 'admin@kontfeel.fr', name: 'Admin', firstName: 'Admin', lastName: 'System', password: passwordHash, mustChangePassword: true, role: 'ADMIN', permissions: ['MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_SETTINGS'], companyId },
  })
  console.log({ admin })

  // 5. Accessories
  const accessories = [
    { name: 'Grip Magnétique', description: '75mm', price: 1.82, supplier: 'Caractères', weight: 76 },
    { name: 'Potence magnétique', description: '250mm / 2 crochets mobiles', price: 1.85, supplier: 'Caractères', weight: 155 },
  ]
  for (const acc of accessories) {
    const existing = await prisma.accessory.findFirst({
      where: { name: acc.name, companyId },
    })
    if (!existing) {
      await prisma.accessory.create({ data: { ...acc, companyId } })
    }
  }
  console.log('Seeded accessories:', accessories.map(a => a.name))

  // 6. Settings
  await seedSettings(prisma, companyId)

  // 7. Transport Shipments
  await seedTransportShipments(prisma)

  // 8. Packaging Pricing
  await seedPackagingPricing(prisma, companyId)

  console.log('✅ Seed terminé avec succès !')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
