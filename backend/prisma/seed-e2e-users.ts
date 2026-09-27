import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:66luthfi29@localhost:5432/erp_db_test?schema=public';
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashed = await bcrypt.hash('password123', 10);
  const DEFAULT_ORG_ID = 'a0000000-0000-4000-8000-000000000001';

  const users = [
    { email: 'admin@nexerp.id', fullName: 'Admin NexERP', roles: [UserRole.SUPER_ADMIN] },
    { email: 'admin@dreamlab.com', fullName: 'Admin Dreamlab', roles: [UserRole.SUPER_ADMIN] },
    { email: 'irma@nexerp.id', fullName: 'Irma', roles: [UserRole.FINANCE, UserRole.PURCHASING] },
    { email: 'edi@nexerp.id', fullName: 'Edi', roles: [UserRole.RND] },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: hashed, roles: u.roles, status: UserStatus.ACTIVE, organizationId: DEFAULT_ORG_ID },
      create: { email: u.email, fullName: u.fullName, passwordHash: hashed, roles: u.roles, status: UserStatus.ACTIVE, organizationId: DEFAULT_ORG_ID },
    });

    await prisma.tenantScope.deleteMany({
      where: { userId: user.id },
    });
    await prisma.tenantScope.create({
      data: {
        userId: user.id,
        organizationId: DEFAULT_ORG_ID,
        effectiveFrom: new Date('2020-01-01'),
        primary: true,
      },
    });

    console.log(`  ✅ ${u.email} (tenant: ${DEFAULT_ORG_ID})`);
  }

  await prisma.$disconnect();
  console.log('✅ E2E Users Seeded.');
}

main().catch((e) => { console.error(e); process.exit(1); });
