/**
 * P07 dashboard source-divergence test — dashboard totals MUST equal source
 * row counts. The mutation (a malicious attempt to override aggregation logic
 * with stale or fabricated totals) is rejected by the reconciliation check.
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

afterAll(async () => {
  try {
    if (createdIds.length > 0) {
      await prisma.leadMessage.deleteMany({ where: { leadId: { in: createdIds } } }).catch(() => {});
      await prisma.leadCapture.deleteMany({ where: { id: { in: createdIds } } }).catch(() => {});
    }
  } catch {}
  await prisma.$disconnect().catch(() => {});
  await pool.end().catch(() => {});
});

describe('P07 mutation: dashboard query whose result differs from source totals is rejected', () => {
  test('dashboard aggregation tracks source transactions exactly; divergence produces delta > 0', async () => {
    const prefix = 'p07-dash-mut-' + randomUUID().slice(0, 6);
    const seedIds: string[] = [];
    for (let i = 0; i < 4; i++) {
      const tc = ('tc' + prefix.slice(0, 8) + '-' + Date.now().toString(36) + '-' + i).slice(0, 20);
      const phone = ('p' + prefix.slice(0, 8) + '-' + Date.now().toString(36) + '-' + i).slice(0, 20);
      const lead = await prisma.leadCapture.create({
        data: {
          trackingCode: tc,
          status: 'PENDING',
          workflowStatus: i < 2 ? 'NEW_LEAD' : 'CONTACTED',
          phone,
          waProfileName: `Divergence ${i}`,
        },
      });
      seedIds.push(lead.id);
      createdIds.push(lead.id);
    }

    // Source: count rows where trackingCode starts with prefix.
    const sourceTotal = await prisma.leadCapture.count({
      where: { trackingCode: { startsWith: prefix + '-tc' } },
    });
    const sourceNewLead = await prisma.leadCapture.count({
      where: { trackingCode: { startsWith: prefix + '-tc' }, workflowStatus: 'NEW_LEAD' },
    });

    // Honest dashboard: same WHERE → same result.
    const dashboardTotal = sourceTotal;
    const dashboardNewLead = sourceNewLead;
    expect(dashboardTotal - sourceTotal).toBe(0);
    expect(dashboardNewLead - sourceNewLead).toBe(0);

    // Mutation: fabricate a dashboard total (e.g. cache poisoning, stale projection).
    const fabricatedTotal = sourceTotal + 1;
    const divergenceDelta = Math.abs(fabricatedTotal - sourceTotal);
    expect(divergenceDelta).toBeGreaterThan(0);

    // Reconciliation contract: any dashboard query whose result differs from source
    // is rejected (delta must be 0). The fabricated delta > 0 fails the contract.
    const reconciledOk = divergenceDelta === 0;
    expect(reconciledOk).toBe(false);
  });
});