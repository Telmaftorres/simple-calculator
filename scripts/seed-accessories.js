/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const accessories = [
    {
      name: 'Grip Magnétique',
      description: '75mm',
      price: 1.82,
      supplier: 'Caractères',
      weight: 76,
    },
    {
      name: 'Potence magnétique',
      description: '250mm / 2 crochets mobiles',
      price: 1.85,
      supplier: 'Caractères',
      weight: 155,
    },
  ]

  for (const acc of accessories) {
    const existing = await prisma.accessory.findFirst({
      where: { name: acc.name },
    })

    if (!existing) {
      await prisma.accessory.create({
        data: acc,
      })
      console.log(`Created accessory: ${acc.name}`)
    } else {
      console.log(`Accessory ${acc.name} already exists`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
