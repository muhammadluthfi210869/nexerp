import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashed = await bcrypt.hash('password123', 10);

  const users = [
    { email: 'admin@nexerp.id', fullName: 'Admin', roles: [UserRole.SUPER_ADMIN] },
    { email: 'irma@nexerp.id', fullName: 'Irma', roles: [UserRole.FINANCE, UserRole.PURCHASING] },
    { email: 'edi@nexerp.id', fullName: 'Edi', roles: [UserRole.RND] },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: hashed, roles: u.roles, status: UserStatus.ACTIVE },
      create: { email: u.email, fullName: u.fullName, passwordHash: hashed, roles: u.roles, status: UserStatus.ACTIVE },
    });
    console.log(`  ✅ ${u.email}`);
  }

  await prisma.$disconnect();
  console.log('✅ E2E Users Seeded.');
}

main().catch((e) => { console.error(e); process.exit(1); });
