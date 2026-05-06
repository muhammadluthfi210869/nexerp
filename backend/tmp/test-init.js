
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('DATABASE_URL:', !!process.env.DATABASE_URL);
console.log('PRISMA_CLIENT_ENGINE_TYPE:', !!process.env.PRISMA_CLIENT_ENGINE_TYPE);

async function main() {
  const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
  });

  console.log('Connecting...');
  await prisma.$connect();
  console.log('Connected!');
  
  const userCount = await prisma.user.count();
  console.log('User count:', userCount);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    // We don't have a prisma instance if it failed to init
  });
