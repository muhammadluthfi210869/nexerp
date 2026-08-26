import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * R4 Bootstrap Reconciliation — id:empotent.
 * Ensures each R4-bootstrap role user has the corresponding staff record
 * required by downstream business code paths. Runs against any
 * environment that has the 8 R4-bootstrap users.
 */
async function reconcileAll() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  console.log('--- STAFF RECONCILIATION START ---');

  try {
    // 1. BussdevStaff — required by lead.service.ts PIC fallback.
    const bdUsers = await prisma.user.findMany({
      where: { roles: { has: 'COMMERCIAL' } },
    });
    for (const u of bdUsers) {
      const existing = await prisma.bussdevStaff.findUnique({ where: { userId: u.id } });
      if (!existing) {
        await prisma.bussdevStaff.create({
          data: {
            userId: u.id,
            name: u.fullName || 'Unknown BD Staff',
            targetRevenue: 100000000,
            isActive: true,
          },
        });
        console.log(`✓ BussdevStaff created for ${u.email}`);
      } else {
        console.log(`• BussdevStaff already exists for ${u.email}`);
      }
    }

    // 2. RndStaff — required by sample-request PIC fallback.
    const rndUsers = await prisma.user.findMany({
      where: { roles: { has: 'RND' } },
    });
    for (const u of rndUsers) {
      const existing = await prisma.rndStaff.findFirst({ where: { name: u.fullName || '' } });
      if (!existing) {
        await prisma.rndStaff.create({
          data: {
            name: u.fullName || 'Unknown RND Staff',
            specialty: 'General',
            isActive: true,
            maxWeeklyCapacity: 10,
          },
        });
        console.log(`✓ RndStaff created for ${u.email}`);
      } else {
        console.log(`• RndStaff already exists for ${u.email}`);
      }
    }

    console.log('--- STAFF RECONCILIATION COMPLETE ---');
  } catch (err) {
    console.error('Critical Error during reconciliation:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

reconcileAll();
