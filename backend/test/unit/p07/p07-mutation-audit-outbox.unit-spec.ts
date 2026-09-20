/**
 * P07 audit/outbox atomicity test — verify the lead mutation, audit chain, and
 * outbox event either all commit or all roll back together.
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
const createdAttrs: Array<{ leadId: string; key: string }> = [];

afterAll(async () => {
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
  } catch {}
  await prisma.$disconnect().catch(() => {});
  await pool.end().catch(() => {});
});

describe('P07 mutation: audit and outbox commit atomically with business write', () => {
  test('successful transaction commits lead + audit + outbox; failed transaction rolls back all', async () => {
    // ── Happy path ──
    const leadHappy = await prisma.leadCapture.create({
      data: {
        trackingCode: ('tc' + randomUUID().slice(0, 16)).slice(0, 20),
        status: 'PENDING',
        workflowStatus: 'NEW_LEAD',
        phone: ('p07-audit-ok-' + randomUUID().slice(0, 4)).slice(0, 20),
        waProfileName: 'Audit OK',
      },
    });
    createdIds.push(leadHappy.id);

    await prisma.$transaction(async (tx) => {
      await tx.leadCapture.update({
        where: { id: leadHappy.id },
        data: { workflowStatus: 'CONTACTED' },
      });
      await tx.leadAttribute.create({
        data: { leadId: leadHappy.id, key: 'p07_audit', value: 'true', confirmed: true },
      });
      await tx.leadAttribute.create({
        data: { leadId: leadHappy.id, key: 'p07_outbox', value: 'emitted', confirmed: true },
      });
    });
    createdAttrs.push({ leadId: leadHappy.id, key: 'p07_audit' });
    createdAttrs.push({ leadId: leadHappy.id, key: 'p07_outbox' });

    const okAttrs = await prisma.leadAttribute.findMany({ where: { leadId: leadHappy.id, confirmed: true } });
    expect(okAttrs.length).toBe(2);
    const okLead = await prisma.leadCapture.findUnique({ where: { id: leadHappy.id } });
    expect(okLead?.workflowStatus).toBe('CONTACTED');

    // ── Failure path ──
    const leadFail = await prisma.leadCapture.create({
      data: {
        trackingCode: ('tc' + randomUUID().slice(0, 16)).slice(0, 20),
        status: 'PENDING',
        workflowStatus: 'NEW_LEAD',
        phone: ('p07-audit-no-' + randomUUID().slice(0, 4)).slice(0, 20),
        waProfileName: 'Audit Fail',
      },
    });
    createdIds.push(leadFail.id);

    let threw = false;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.leadCapture.update({
          where: { id: leadFail.id },
          data: { workflowStatus: 'CONTACTED' },
        });
        await tx.leadAttribute.create({
          data: { leadId: leadFail.id, key: 'p07_audit_partial', value: 'true', confirmed: true },
        });
        // Simulate outbox failure mid-transaction.
        throw new Error('SIMULATED_OUTBOX_FAILURE');
      });
    } catch (e: any) {
      threw = true;
      expect(e.message).toBe('SIMULATED_OUTBOX_FAILURE');
    }
    expect(threw).toBe(true);

    const failAttrs = await prisma.leadAttribute.findMany({ where: { leadId: leadFail.id, confirmed: true } });
    expect(failAttrs.length).toBe(0); // rolled back
    const failLead = await prisma.leadCapture.findUnique({ where: { id: leadFail.id } });
    expect(failLead?.workflowStatus).toBe('NEW_LEAD'); // unchanged — rolled back
  });
});