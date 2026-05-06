import { PrismaClient } from '@prisma/client'
console.log('--- ESM v10.0.9 ---')

try {
  console.log('Calling: new PrismaClient()')
  const prisma = new PrismaClient()
  console.log('Result:', !!prisma)
  await prisma.$connect()
  console.log('CONNECTED!')
  await prisma.$disconnect()
} catch (err) {
  console.error('FAILED with err:', err)
}
