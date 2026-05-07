import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'zaki@dreamlab.com';
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    console.error(`❌ User ${email} not found`);
    return;
  }
  
  const updatedRoles = [...new Set([...existing.roles, UserRole.DIRECTOR])];

  const user = await prisma.user.update({
    where: { email },
    data: {
      roles: updatedRoles
    }
  });

  console.log(`✅ Updated ${email} roles: [${user.roles.join(', ')}]`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
