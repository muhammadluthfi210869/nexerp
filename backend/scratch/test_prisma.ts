import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  console.log('PrismaClient instantiated successfully');
  try {
    // Just a basic check
    console.log('Available models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
