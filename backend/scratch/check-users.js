
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, roles: true }
  });
  console.log('USERS:' + JSON.stringify(users));
}

main().catch(console.error).finally(() => {
    prisma.$disconnect();
    pool.end();
});
