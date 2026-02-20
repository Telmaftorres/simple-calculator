/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@kontfeel.fr'
  const password = 'admin' // Initial password - should be changed
  const hashedPassword = await bcrypt.hash(password, 10)

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin',
        firstName: 'Admin',
        lastName: 'System',
      },
    })
    console.log(`Created user: ${email}`)
  } else {
    console.log(`User ${email} already exists.`)
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
