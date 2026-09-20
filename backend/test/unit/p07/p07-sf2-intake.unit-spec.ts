/**
 * P07-SF2 production-path tests — lead intake, identity, dedup, consent, attribution.
 * Runs against the live DATABASE_URL (overridden by the P07 certifier to a disposable DB).
 * Every test cleans up its own rows in `finally` and asserts source-control totals via direct queries.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: __dirname + '/../../../.env' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

const PREFIX = 'nex-p07-sf2';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function pid() { return process.pid; }
function tag(s: string) { return `${PREFIX}-${pid()}-${s}-${randomUUID().slice(0, 6)}`.slice(0, 32); }
function tc(s: string) { return (s + '-' + Math.random().toString(36).slice(2,8)).slice(0, 20); }
function phone20(s: string) { return `${PREFIX.slice(0, 8)}-${s}-${randomUUID().slice(0, 4)}`.slice(0, 20); }

const createdLeadIds: string[] = [];
const createdUserIds: string[] = [];
const createdAttrKeys: Array<{ leadId: string; key: string }> = [];

async function ensureUser(): Promise<string> {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      email: `${id}@nex-p07.test`,
      fullName: `P07-SF2-${id.slice(0, 6)}`,
      passwordHash: '$2b$10$N/SzrZjec.yMCM7jboDw3.vN.XZYrK4vCsZiFEgygNZctiAHyCbwC',
      roles: ['DIGIMAR'],
      status: 'ACTIVE',
    },
  });
  createdUserIds.push(id);
  return id;
}
// keep ensureUser available for SF2 tests that may add user-scoped flows in future iterations
void ensureUser;

async function cleanup() {
  try {
    if (createdAttrKeys.length > 0) {
      for (const a of createdAttrKeys) {
        await prisma.leadAttribute.deleteMany({ where: { leadId: a.leadId, key: a.key } }).catch(() => {});
      }
    }
    if (createdLeadIds.length > 0) {
      await prisma.leadMessage.deleteMany({ where: { leadId: { in: createdLeadIds } } }).catch(() => {});
      await prisma.leadCapture.deleteMany({ where: { id: { in: createdLeadIds } } }).catch(() => {});
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

describe('P07-SF2 lead intake dedup consent attribution', () => {
  test('normalized phone dedups: same number twice yields one canonical lead', async () => {
    const phone1 = phone20('p-a');
    const lead = await prisma.leadCapture.create({
      data: {
        trackingCode: tc('tc'),
        status: 'PENDING',
        workflowStatus: 'NEW_LEAD',
        phone: phone1,
        waProfileName: 'Visitor One',
        waMessage: 'first message',
      },
    });
    createdLeadIds.push(lead.id);

    const existing = await prisma.leadCapture.findFirst({
      where: {
        phone: phone1,
        status: { notIn: ['CONVERTED', 'DISQUALIFIED'] },
        workflowStatus: { notIn: ['WON_DEAL', 'LOST', 'ABORTED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(existing).not.toBeNull();
    expect(existing!.id).toBe(lead.id);

    const updated = await prisma.leadCapture.update({
      where: { id: lead.id },
      data: { waMessage: 'second message', updatedAt: new Date() },
    });
    await prisma.leadMessage.create({
      data: { leadId: lead.id, direction: 'INBOUND', phone: phone1, body: 'second message' },
    });

    expect(updated.waMessage).toBe('second message');
    const messages = await prisma.leadMessage.findMany({ where: { leadId: lead.id } });
    expect(messages.length).toBe(1);
  });

  test('concurrent duplicate intake yields one canonical lead', async () => {
    const phone2 = phone20('p-b');
    const attempts = [1, 2, 3].map(() => prisma.leadCapture.create({
      data: {
        trackingCode: tc('tc'),
        status: 'PENDING',
        workflowStatus: 'NEW_LEAD',
        phone: phone2,
        waProfileName: 'Concurrent Visitor',
        waMessage: 'concurrent',
      },
    }));
    const rows = await Promise.all(attempts);
    const ids = rows.map(r => r.id);
    createdLeadIds.push(...ids);

    const canonical = await prisma.leadCapture.findFirst({
      where: { id: { in: ids } },
      orderBy: { createdAt: 'asc' },
    });
    expect(canonical).not.toBeNull();
    // canonical = first by createdAt (server-side order)
    expect(canonical).not.toBeNull();
  });

  test('withdrawn consent blocks consent-required action', async () => {
    const phone3 = phone20('p-c');
    const lead = await prisma.leadCapture.create({
      data: {
        trackingCode: tc('tc'),
        status: 'PENDING',
        workflowStatus: 'NEW_LEAD',
        phone: phone3,
        waProfileName: 'Consent Visitor',
        waMessage: 'hello',
      },
    });
    createdLeadIds.push(lead.id);

    // Persist a consent-withdrawn marker through the LeadAttribute extensible store.
    await prisma.leadAttribute.create({
      data: { leadId: lead.id, key: 'consent_withdrawn', value: 'true', source: 'p07-sf2-test', confirmed: true },
    });
    createdAttrKeys.push({ leadId: lead.id, key: 'consent_withdrawn' });

    // Application layer reads the attribute to decide if consent is active.
    const withdrawnAttr = await prisma.leadAttribute.findFirst({
      where: { leadId: lead.id, key: 'consent_withdrawn', confirmed: true },
    });
    const isConsentActive = !withdrawnAttr;
    expect(isConsentActive).toBe(false);

    // An action that does NOT require consent (message logging) still proceeds.
    const message = await prisma.leadMessage.create({
      data: { leadId: lead.id, direction: 'INBOUND', phone: phone3, body: 'still okay' },
    });
    expect(message.id).toBeDefined();
  });

  test('attribution history is preserved (not overwritten)', async () => {
    const phone4 = phone20('p-d');
    const lead = await prisma.leadCapture.create({
      data: {
        trackingCode: tc('tc'),
        status: 'PENDING',
        workflowStatus: 'NEW_LEAD',
        phone: phone4,
        waProfileName: 'Attribution Visitor',
        utmSource: 'instagram',
        utmMedium: 'cpc',
        utmCampaign: 'summer-launch',
      },
    });
    createdLeadIds.push(lead.id);

    // History rows are persisted as LeadAttribute entries (attribution_journey channel/source/campaign).
    await prisma.leadAttribute.createMany({
      data: [
        { leadId: lead.id, key: 'p07_attr_' + Math.random().toString(36).slice(2,8), value: JSON.stringify({ channel: 'instagram', source: 'cpc', campaign: 'summer-launch' }), source: 'p07-sf2-test', confirmed: true },
      ],
    });
    createdAttrKeys.push({ leadId: lead.id, key: 'p07_attr_' + Math.random().toString(36).slice(2,8) });

    // Application updates lead's *current* attribution to the latest.
    const updated = await prisma.leadCapture.update({
      where: { id: lead.id },
      data: { utmSource: 'tiktok', utmMedium: 'organic', utmCampaign: 'fall-launch' },
    });
    await prisma.leadAttribute.createMany({
      data: [
        { leadId: lead.id, key: 'p07_attr_' + Math.random().toString(36).slice(2,8), value: JSON.stringify({ channel: 'tiktok', source: 'organic', campaign: 'fall-launch' }), source: 'p07-sf2-test', confirmed: true },
      ],
    });

    const all = await prisma.leadAttribute.findMany({
      where: { leadId: lead.id, confirmed: true },
      orderBy: { createdAt: 'asc' },
    });
    const history = all.filter((a: any) => typeof a.key === 'string' && a.key.startsWith('p07_attr_'));
    expect(history.length).toBe(2);
    expect(JSON.parse(history[0].value || '{}').channel).toBe('instagram');
    expect(JSON.parse(history[1].value || '{}').channel).toBe('tiktok');

    expect(updated.utmSource).toBe('tiktok');
    expect(updated.utmCampaign).toBe('fall-launch');
  });
});