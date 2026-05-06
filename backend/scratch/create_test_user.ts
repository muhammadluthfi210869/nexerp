
import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'marketing@dreamlab.com' },
    update: { roles: [UserRole.DIGIMAR] },
    create: {
      email: 'marketing@dreamlab.com',
      fullName: 'Marketing Team',
      passwordHash: hashedPassword,
      roles: [UserRole.DIGIMAR],
      status: 'ACTIVE',
    },
  });
  console.log('✅ Marketing Test User Created');
}

main().finally(() => prisma.$disconnect());
