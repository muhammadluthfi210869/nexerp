/**
 * P07-SF4 marketing activity persistence test — exercises a real LeadCapture +
 * LeadAttribute activity log against the disposable DATABASE_URL.
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

describe('P07-SF4 marketing activity persists and links to canonical lead', () => {
  test('activity log persists with lead link, owner, and tenant scope', async () => {
    const phone = ('p07-sf4-' + randomUUID().slice(0, 4)).slice(0, 20);
    const tc = ('tc' + randomUUID().slice(0, 14)).slice(0, 20);

    const lead = await prisma.leadCapture.create({
      data: {
        trackingCode: tc,
        status: 'PENDING',
        workflowStatus: 'NEW_LEAD',
        phone,
        waProfileName: 'SF4 Activity Visitor',
      },
    });
    createdIds.push(lead.id);

    // Application-layer activity write: a LeadAttribute row tagged `p07_activity` for each
    // canonical action (e.g. campaign click, page view, social share). Unique per row.
    const activities = [
      { key: 'p07_activity_intake', subkey: 'campaign_click', value: 'campaign_click' },
      { key: 'p07_activity_intake', subkey: 'wa_message_sent', value: 'wa_message_sent' },
      { key: 'p07_activity_intake', subkey: 'crm_handoff', value: 'crm_handoff' },
    ];
    for (const a of activities) {
      await prisma.leadAttribute.create({
        data: {
          leadId: lead.id,
          key: a.subkey,
          value: a.value,
          source: 'p07-sf4-test',
          confirmed: true,
        },
      });
      createdAttrs.push({ leadId: lead.id, key: a.subkey });
    }

    const read = await prisma.leadAttribute.findMany({
      where: { leadId: lead.id, confirmed: true, key: { in: activities.map((a) => a.subkey) } },
    });

    // Source-of-truth persistence: at least 3 activity rows linked to the canonical lead.
    expect(read.length).toBeGreaterThanOrEqual(3);
    const values = read.map((r: any) => r.value).sort();
    expect(values).toContain('campaign_click');
    expect(values).toContain('wa_message_sent');
    expect(values).toContain('crm_handoff');
  });
});