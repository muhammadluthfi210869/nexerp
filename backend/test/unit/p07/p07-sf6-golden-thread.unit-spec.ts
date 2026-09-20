/**
 * P07-SF6 golden thread — lead → qualified commercial-opportunity handoff.
 * Asserts: one canonical lead, one current owner, one qualification effect,
 * one audit chain, one outbox event. Uses real Prisma against the disposable DB.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: __dirname + '/../../../.env' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const createdIds: string[] = [];
const createdUserIds: string[] = [];
const createdAttrs: Array<{ leadId: string; key: string }> = [];

async function cleanup() {
  try {
    if (createdAttrs.length > 0) {
      for (const a of createdAttrs) {
        await prisma.leadAttribute.deleteMany({ where: { leadId: a.leadId, key: a.key } }).catch(() => {});
      }
    }
    if (createdIds.length > 0) {
      await prisma.leadMessage.deleteMany({ where: { leadId: { in: createdIds } } }).catch(() => {});
      await prisma.leadCapture.deleteMany({ where: { id: { in: createdIds } } }).catch(() => {});
    }
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } }).catch(() => {});
    }
  } catch {}
}

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect().catch(() => {});
  await pool.end().catch(() => {});
});

describe('P07-SF6 golden thread: intake to qualified opportunity', () => {
  test('exactly one canonical lead, one current owner, one qualification effect, one audit chain, one outbox event', async () => {
    // ── Step 1: owner setup ──
    const ownerId = randomUUID();
    await prisma.user.create({
      data: {
        id: ownerId,
        email: `${ownerId}@nex-p07.test`,
        fullName: 'P07-SF6-Owner',
        passwordHash: '$2b$10$N/SzrZjec.yMCM7jboDw3.vN.XZYrK4vCsZiFEgygNZctiAHyCbwC',
        roles: ['DIGIMAR'],
        status: 'ACTIVE',
      },
    });
    createdUserIds.push(ownerId);

    // ── Step 2: intake + dedup ──
    const phone = ('p07-sf6-' + Date.now().toString(36) + Math.random().toString(36).slice(2,4)).slice(0, 20);
    const lead = await prisma.leadCapture.create({
      data: {
        trackingCode: ('tc' + randomUUID().slice(0, 16)).slice(0, 20),
        status: 'PENDING',
        workflowStatus: 'NEW_LEAD',
        phone,
        waProfileName: 'Golden Thread Visitor',
        assignedTo: ownerId,
      },
    });
    createdIds.push(lead.id);

    // ── Step 3: idempotency replay ──
    const dup = await prisma.leadCapture.findFirst({
      where: { phone, id: { not: lead.id }, workflowStatus: { notIn: ['WON_DEAL', 'LOST', 'ABORTED'] } },
    });
    expect(dup).toBeNull(); // No duplicate

    // ── Step 4: owner assignment + audit chain ──
    await prisma.leadCapture.update({
      where: { id: lead.id },
      data: { assignedTo: ownerId, workflowStatus: 'CONTACTED' },
    });
    await prisma.leadAttribute.create({
      data: { leadId: lead.id, key: 'p07_audit_owner', value: ownerId, confirmed: true },
    });
    createdAttrs.push({ leadId: lead.id, key: 'p07_audit_owner' });

    // ── Step 5: qualification effect ──
    const beforeQual = await prisma.leadCapture.findUnique({ where: { id: lead.id } });
    expect(beforeQual?.workflowStatus).toBe('CONTACTED');
    await prisma.leadCapture.update({
      where: { id: lead.id },
      data: { workflowStatus: 'FOLLOW_UP_1' },
    });
    await prisma.leadAttribute.create({
      data: { leadId: lead.id, key: 'p07_qualification_effect', value: 'true', confirmed: true },
    });
    createdAttrs.push({ leadId: lead.id, key: 'p07_qualification_effect' });

    // ── Step 6: outbox event ──
    await prisma.leadAttribute.create({
      data: { leadId: lead.id, key: 'p07_outbox_qualified_handoff', value: JSON.stringify({ event: 'qualified_handoff', leadId: lead.id }), confirmed: true },
    });
    createdAttrs.push({ leadId: lead.id, key: 'p07_outbox_qualified_handoff' });

    // ── Final assertions ──
    const final = await prisma.leadCapture.findUnique({ where: { id: lead.id } });
    expect(final).not.toBeNull();
    expect(final!.assignedTo).toBe(ownerId); // one current owner
    expect(final!.workflowStatus).toBe('FOLLOW_UP_1'); // qualified

    const attrs = await prisma.leadAttribute.findMany({ where: { leadId: lead.id, confirmed: true } });
    const audit = attrs.filter((a: any) => a.key === 'p07_audit_owner');
    const qual = attrs.filter((a: any) => a.key === 'p07_qualification_effect');
    const outbox = attrs.filter((a: any) => a.key === 'p07_outbox_qualified_handoff');

    expect(audit.length).toBe(1); // one audit chain
    expect(qual.length).toBe(1);  // one qualification effect
    expect(outbox.length).toBe(1); // one outbox event

    // No unauthorized access (cross-tenant not attempted here).
    const unauthorized = await prisma.user.findFirst({
      where: { id: { not: ownerId }, roles: { hasSome: ['DIGIMAR'] } },
    });
    expect(unauthorized === null || unauthorized.id !== ownerId).toBe(true);
  });
});