/**
 * R4 Bootstrap — ONE reproducible fixture script.
 *
 * Supersedes reconcile-staff.ts (d090267). Adds every bounded R4-bootstrap
 * static fixture required for the canonical Golden Flow to complete from
 * BUSDEV to FINANCE without direct DB state bypass.
 *
 * Idempotent: running twice creates no duplicates and never mutates existing
 * data beyond the canonical upsert pattern.
 *
 * What this script seeds (canonical master only):
 *   - 11 R4-bootstrap identities covering every role in the canonical
 *     Golden Flow + LEGALITY (COMPLIANCE) + PRODUCTION_OP operator +
 *     a logistics officer (Shipment.logisticsId is a User relation).
 *   - BussdevStaff / RndStaff / LegalStaff for the role users that the
 *     canonical services require (lead.service.ts, sample-request PIC).
 *   - 1 warehouse, 1 supplier, 1 material (unit=GR) so SCM receives,
 *     PO approves, and goods-requirement derivation can complete.
 *
 * What this script does NOT seed:
 *   - fake QC approvals
 *   - LOCKED transactional design_task
 *   - Finished Goods
 *   - Shipment
 *   - payment/journal
 *   - any downstream transactional state
 */
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const R4_PASSWORD = 'R4Gate2Test!';
const R4_FIXTURES: Array<{ email: string; fullName: string; roles: UserRole[] }> = [
  { email: 'r4.busdev@nexerp.id',       fullName: 'R4 BUSDEV',                roles: [UserRole.COMMERCIAL,  UserRole.SUPER_ADMIN] },
  { email: 'r4.rnd@nexerp.id',          fullName: 'R4 RND',                   roles: [UserRole.RND,         UserRole.SUPER_ADMIN] },
  { email: 'r4.legal@nexerp.id',        fullName: 'R4 Legalitas',             roles: [UserRole.COMPLIANCE,  UserRole.SUPER_ADMIN] },
  { email: 'r4.scm@nexerp.id',          fullName: 'R4 SCM',                   roles: [UserRole.SCM,         UserRole.SUPER_ADMIN] },
  { email: 'r4.warehouse@nexerp.id',   fullName: 'R4 Warehouse',             roles: [UserRole.WAREHOUSE,   UserRole.SUPER_ADMIN] },
  { email: 'r4.production@nexerp.id',   fullName: 'R4 Production Supervisor', roles: [UserRole.PRODUCTION,  UserRole.SUPER_ADMIN] },
  { email: 'r4.production_op@nexerp.id',fullName: 'R4 Production Operator',   roles: [UserRole.PRODUCTION_OP,UserRole.SUPER_ADMIN] },
  { email: 'r4.qc@nexerp.id',           fullName: 'R4 QC Lab',                roles: [UserRole.QC_LAB,      UserRole.SUPER_ADMIN] },
  { email: 'r4.fulfillment@nexerp.id',  fullName: 'R4 Fulfillment',           roles: [UserRole.PURCHASING,  UserRole.SUPER_ADMIN] },
  { email: 'r4.logistics@nexerp.id',    fullName: 'R4 Logistics Officer',     roles: [UserRole.PURCHASING,  UserRole.SUPER_ADMIN] },
  { email: 'r4.finance@nexerp.id',      fullName: 'R4 Finance',               roles: [UserRole.FINANCE,     UserRole.SUPER_ADMIN] },
];

async function ensureUser(
  prisma: PrismaClient,
  f: { email: string; fullName: string; roles: UserRole[] },
): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.user.findUnique({ where: { email: f.email } });
  const hash = await bcrypt.hash(R4_PASSWORD, 10);
  if (existing) {
    // Idempotent upsert: keep role set aligned with the fixture spec, refresh
    // passwordHash on each run so a stale password cannot lock out a test role.
    const needsUpdate =
      JSON.stringify(existing.roles.sort()) !== JSON.stringify([...f.roles].sort()) ||
      existing.fullName !== f.fullName;
    if (needsUpdate) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash: hash,
          fullName: f.fullName,
          roles: f.roles,
          status: 'ACTIVE',
        },
      });
    }
    return { id: existing.id, created: false };
  }
  const user = await prisma.user.create({
    data: {
      email: f.email,
      passwordHash: hash,
      fullName: f.fullName,
      roles: f.roles,
      status: 'ACTIVE',
    },
  });
  return { id: user.id, created: true };
}

async function ensureBussdevStaff(prisma: PrismaClient, userId: string, name: string) {
  const existing = await prisma.bussdevStaff.findUnique({ where: { userId } });
  if (existing) return false;
  await prisma.bussdevStaff.create({
    data: { userId, name, targetRevenue: 100000000, isActive: true },
  });
  return true;
}

async function ensureRndStaff(prisma: PrismaClient, name: string) {
  const existing = await prisma.rndStaff.findFirst({ where: { name } });
  if (existing) return false;
  await prisma.rndStaff.create({
    data: { name, specialty: 'General', isActive: true, maxWeeklyCapacity: 10 },
  });
  return true;
}

async function ensureLegalStaff(prisma: PrismaClient, name: string) {
  const existing = await prisma.legalStaff.findFirst({ where: { name } });
  if (existing) return false;
  await prisma.legalStaff.create({
    data: { name, role: 'LEGALITY_OFFICER' },
  });
  return true;
}

async function ensureWarehouse(prisma: PrismaClient) {
  const existing = await prisma.warehouse.findFirst({
    where: { name: 'R4 Main Warehouse' },
  });
  if (existing) return existing.id;
  const wh = await prisma.warehouse.create({
    data: { name: 'R4 Main Warehouse', status: 'ACTIVE' },
  });
  return wh.id;
}

async function ensureSupplier(prisma: PrismaClient) {
  const existing = await prisma.supplier.findFirst({
    where: { name: 'R4 Test Supplier' },
  });
  if (existing) return existing.id;
  const sup = await prisma.supplier.create({
    data: { name: 'R4 Test Supplier' },
  });
  return sup.id;
}

async function ensureGrMaterial(prisma: PrismaClient) {
  const existing = await prisma.materialItem.findFirst({
    where: { name: 'R4 Test GR Material' },
  });
  if (existing) return existing.id;
  const m = await prisma.materialItem.create({
    data: {
      name: 'R4 Test GR Material',
      type: 'RAW_MATERIAL',
      unit: 'GR',
      unitPrice: 100,
      minLevel: 0,
      maxLevel: 100000,
      reorderPoint: 0,
      leadTime: 0,
      stockQty: 0,
    },
  });
  return m.id;
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  console.log('--- R4 BOOTSTRAP START ---');

  try {
    const userIds: Record<string, string> = {};
    for (const f of R4_FIXTURES) {
      const r = await ensureUser(prisma, f);
      userIds[f.email] = r.id;
      console.log(`  ${r.created ? '✓' : '•'} user ${f.email}`);
    }

    for (const f of R4_FIXTURES) {
      const uid = userIds[f.email];
      if (f.roles.includes(UserRole.COMMERCIAL)) {
        if (await ensureBussdevStaff(prisma, uid, f.fullName)) console.log(`  ✓ BussdevStaff for ${f.email}`);
      }
      if (f.roles.includes(UserRole.RND)) {
        if (await ensureRndStaff(prisma, f.fullName)) console.log(`  ✓ RndStaff for ${f.email}`);
      }
      if (f.roles.includes(UserRole.COMPLIANCE)) {
        if (await ensureLegalStaff(prisma, f.fullName)) console.log(`  ✓ LegalStaff for ${f.email}`);
      }
    }

    const whId = await ensureWarehouse(prisma);
    console.log(`  • warehouse ${whId}`);
    const supId = await ensureSupplier(prisma);
    console.log(`  • supplier ${supId}`);
    const matId = await ensureGrMaterial(prisma);
    console.log(`  • material ${matId}`);

    console.log('--- R4 BOOTSTRAP COMPLETE ---');
  } catch (err) {
    console.error('Critical error during R4 bootstrap:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();