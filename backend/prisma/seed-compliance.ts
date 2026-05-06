import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Synchronizing legal staff repository...');

  // Seed LegalStaff
  const staffs = [
    { name: 'Sarah Compliance', role: 'LEGAL_OFFICER' },
    { name: 'John Audit', role: 'COMPLIANCE_HEAD' },
    { name: 'Budi Legalitas', role: 'LEGAL_OFFICER' }
  ];

  for (const s of staffs) {
    await prisma.legalStaff.upsert({
      where: { id: '00000000-0000-0000-0000-00000000000' + (staffs.indexOf(s) + 1) }, // Dummy UUIDs for seeding
      update: {},
      create: {
        name: s.name,
        role: s.role
      }
    }).catch(async () => {
        // If UUID fails, just create normally
        await prisma.legalStaff.create({ data: s });
    });
  }

  // Ensure compliance user exists in users table
  await prisma.user.upsert({
    where: { email: 'compliance@dreamlab.com' },
    update: {},
    create: {
      fullName: 'Compliance Officer',
      email: 'compliance@dreamlab.com',
      passwordHash: 'password123',
      roles: ['COMPLIANCE'] as any,
    },
  });

  console.log('✅ AUDITORY SETUP COMPLETE: Legal Staff & Users Ready.');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
