import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const pts = await prisma.productType.findMany()
  console.log('ProductTypes:', pts.map(p => p.id))
  
  // also check if there's any pending or broken data
  
}
main()
