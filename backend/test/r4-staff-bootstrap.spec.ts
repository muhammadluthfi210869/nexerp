/**
 * Regression: R4 Bootstrap Staff Invariant
 *
 * Defect: R4-bootstrap users exist (8 roles) but BussdevStaff/RndStaff
 * records were missing, blocking lead creation at
 * `bussdev/services/lead.service.ts:62` ("CRITICAL_FAILURE: Tidak ada
 * Staff BD sama sekali di database").
 *
 * Invariant protected: every COMMERCIAL-role user has a BussdevStaff,
 * and every RND-role user has an RndStaff. Idempotent.
 *
 * Run after `reconcile-staff.ts` against the deployed R4 shadow DB.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

describe('R4 staff bootstrap invariant', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('COMMERCIAL users have BussdevStaff records', async () => {
    const commercialUsers = await prisma.user.findMany({
      where: { roles: { has: 'COMMERCIAL' } },
      select: { id: true, email: true },
    });
    expect(commercialUsers.length).toBeGreaterThan(0);
    for (const u of commercialUsers) {
      const staff = await prisma.bussdevStaff.findUnique({ where: { userId: u.id } });
      expect(staff).not.toBeNull();
      expect(staff?.isActive).toBe(true);
    }
  });

  it('RND users have RndStaff records', async () => {
    const rndUsers = await prisma.user.findMany({
      where: { roles: { has: 'RND' } },
      select: { id: true, email: true, fullName: true },
    });
    expect(rndUsers.length).toBeGreaterThan(0);
    for (const u of rndUsers) {
      const staff = await prisma.rndStaff.findFirst({ where: { name: u.fullName || undefined } });
      expect(staff).not.toBeNull();
      expect(staff?.isActive).toBe(true);
    }
  });
});
