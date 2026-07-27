const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: ['aurel@nexerp.id', 'aurel@dreamlab.com', 'revita@nexerp.id'] } },
    select: { email: true, fullName: true, roles: true }
  });
  for (const u of users) console.log(`${u.email}: ${u.fullName} -> roles: ${u.roles.join(',')}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
