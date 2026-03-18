import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function seedSettings() {
  const settings = [
    // ── Impression ──
    {
      key: 'HOURLY_RATE_PRINT',
      value: '65',
      label: 'Taux horaire impression',
      unit: '€/h',
    },
    {
      key: 'PRINT_SETUP_TIME_MIN',
      value: '15',
      label: 'Calage impression',
      unit: 'min',
    },
    {
      key: 'PRINT_SPEED_PRODUCTION',
      value: '60',
      label: 'Vitesse impression production',
      unit: 'm²/h',
    },
    {
      key: 'PRINT_SPEED_QUALITY',
      value: '30',
      label: 'Vitesse impression qualité',
      unit: 'm²/h',
    },
    {
      key: 'INK_COST_PER_LITER',
      value: '40',
      label: "Coût de l'encre",
      unit: '€/L',
    },
    {
      key: 'INK_BASE_ML_PER_PLATE',
      value: '20',
      label: "Encre de base par plaque",
      unit: 'ml',
    },
    {
      key: 'FINISHING_SURCHARGE_PERCENT',
      value: '0.05',
      label: 'Supplément finitions (vernis, aplat)',
      unit: '%',
    },

    // ── Découpe ──
    {
      key: 'CUTTING_SETUP_MINUTES',
      value: '15',
      label: 'Calage découpe',
      unit: 'min',
    },

    // ── Façonnage ──
    {
      key: 'HOURLY_RATE_ASSEMBLY',
      value: '45',
      label: 'Taux horaire façonnage',
      unit: '€/h',
    },

    // ── Conditionnement ──
    {
      key: 'ASSEMBLY_NOTICE_COST_PER_PIECE',
      value: '0.10',
      label: 'Coût notice de montage',
      unit: '€/pce',
    },

    // ── Imposition ──
    {
      key: 'POSE_SPACING_MM',
      value: '10',
      label: 'Espacement entre poses',
      unit: 'mm',
    },

    // ── Emballage ──
    {
      key: 'HOURLY_RATE_PACKAGING',
      value: '45',
      label: 'Taux horaire emballage',
      unit: '€/h',
    },
    {
      key: 'PACKAGING_SETUP_MINUTES',
      value: '15',
      label: 'Calage emballage',
      unit: 'min',
    },

    // ── Marges (réservé — non fonctionnel) ──
    {
      key: 'MARGIN_IMPRESSION',
      value: '0',
      label: 'Marge impression',
      unit: '%',
    },
    {
      key: 'MARGIN_DECOUPE',
      value: '0',
      label: 'Marge découpe',
      unit: '%',
    },
    {
      key: 'MARGIN_FACONNAGE',
      value: '0',
      label: 'Marge façonnage',
      unit: '%',
    },
    {
      key: 'MARGIN_CONDITIONNEMENT',
      value: '0',
      label: 'Marge conditionnement',
      unit: '%',
    },
    {
      key: 'MARGIN_MATERIAUX',
      value: '0',
      label: 'Marge matériaux',
      unit: '%',
    },
    {
      key: 'MARGIN_EMBALLAGE',
      value: '0',
      label: 'Marge emballage',
      unit: '%',
    },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
    console.log(`Setting: ${setting.key} = ${setting.value} ${setting.unit}`)
  }
}

async function main() {
  console.log('Seeding database...')

  const seedPassword = process.env.SEED_ADMIN_PASSWORD
  if (!seedPassword) throw new Error('SEED_ADMIN_PASSWORD non défini dans .env')

  // 1. Studies
  const study1 = await prisma.study.upsert({
    where: { number: 'E-2024-001' },
    update: {},
    create: {
      number: 'E-2024-001',
      name: 'Campagne Été 2024',
    },
  })

  // 2. Product Types
  const productType1 = await prisma.productType.upsert({
    where: { name: 'PRESENTOIR DE COMPTOIR' },
    update: {
      flatWidthFormula: '100 + l + L + l',
      flatHeightFormula: '100 + H + l + 100',
    },
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
    update: {
      flatWidthFormula: 'l',
      flatHeightFormula: 'L',
    },
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
  const akylux = await prisma.plate.upsert({
    where: { name: 'Akylux 3mm 1200x1600' },
    update: {},
    create: {
      name: 'Akylux 3mm 1200x1600',
      width: 1200,
      height: 1600,
      cost: 6.12,
      material: 'Akylux 3mm',
    },
  })

  const bc30 = await prisma.plate.upsert({
    where: { name: 'BC 30 2 brun 1700x2100' },
    update: {},
    create: {
      name: 'BC 30 2 brun 1700x2100',
      width: 1700,
      height: 2100,
      cost: 2.44,
      material: 'BC 30 2 brun',
    },
  })

  const ee1700 = await prisma.plate.upsert({
    where: { name: 'EE 1C/1B (20S1G1W) 1700x2100' },
    update: {},
    create: {
      name: 'EE 1C/1B (20S1G1W) 1700x2100',
      width: 1700,
      height: 2100,
      cost: 4.73,
      material: 'EE 1C/1B (20S1G1W)',
    },
  })

  const ee2000 = await prisma.plate.upsert({
    where: { name: 'EE 1C/1B (20S1G1W) 2000x2500' },
    update: {},
    create: {
      name: 'EE 1C/1B (20S1G1W) 2000x2500',
      width: 2000,
      height: 2500,
      cost: 6.83,
      material: 'EE 1C/1B (20S1G1W)',
    },
  })

  const pvc5mm = await prisma.plate.upsert({
    where: { name: 'PVC 5mm 2050x1525' },
    update: {},
    create: {
      name: 'PVC 5mm 2050x1525',
      width: 2050,
      height: 1525,
      cost: 23.62,
      material: 'PVC 5mm',
    },
  })

  const pvc500 = await prisma.plate.upsert({
    where: { name: 'PVC 500 microns 1000x1400' },
    update: {},
    create: {
      name: 'PVC 500 microns 1000x1400',
      width: 1000,
      height: 1400,
      cost: 5.82,
      material: 'PVC 500 microns',
    },
  })

  const pvc3mm = await prisma.plate.upsert({
    where: { name: 'PVC 3mm 2440x1220' },
    update: {},
    create: {
      name: 'PVC 3mm 2440x1220',
      width: 2440,
      height: 1220,
      cost: 15.55,
      material: 'PVC 3mm',
    },
  })

  const pvc300 = await prisma.plate.upsert({
    where: { name: 'PVC 300 microns 1000x1400' },
    update: {},
    create: {
      name: 'PVC 300 microns 1000x1400',
      width: 1000,
      height: 1400,
      cost: 3.42,
      material: 'PVC 300 microns',
    },
  })

  const pvc700 = await prisma.plate.upsert({
    where: { name: 'PVC 700 microns 1000x1400' },
    update: {},
    create: {
      name: 'PVC 700 microns 1000x1400',
      width: 1000,
      height: 1400,
      cost: 8.2,
      material: 'PVC 700 microns',
    },
  })

  console.log({
    study1,
    productType1,
    productType2,
    akylux,
    bc30,
    ee1700,
    ee2000,
    pvc5mm,
    pvc500,
    pvc3mm,
    pvc300,
    pvc700,
  })

  // 4. Admin User
  const passwordHash = await bcrypt.hash(seedPassword, 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kontfeel.fr' },
    update: {
      password: passwordHash,
      role: 'ADMIN',
      permissions: ['MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_SETTINGS'],
    },
    create: {
      email: 'admin@kontfeel.fr',
      name: 'Admin',
      password: passwordHash,
      mustChangePassword: true,
      role: 'ADMIN',
      permissions: ['MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_SETTINGS'],
    },
  })

  console.log({ admin })

  // 5. Settings
  await seedSettings()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })