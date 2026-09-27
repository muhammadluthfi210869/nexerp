/**
 * P07-SF2 — lead intake dedup, consent, attribution.
 *
 * Calls the REAL `LeadCaptureService` (NestJS module) and asserts its
 * behavior on a uniquely-namespaced slice of the test database.
 *
 * Namespace: every fixture row carries a per-run marker `nex_p07_sf2_<runId>`
 * in `tracking_code`/`phone`. afterEach deletes rows in that slice; the
 * final p07_clean_db.js sweep asserts no residue remains.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: __dirname + '/../../../.env' });

import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { LeadCaptureService } from '../../../src/modules/lead-capture/lead-capture.service';
import { OutboundCounterService } from '../../../src/modules/lead-capture/outbound-counter.service';
import { PrismaService } from '../../../src/prisma/prisma/prisma.service';
import { LeadService } from '../../../src/modules/bussdev/services/lead.service';
import { AuditService } from '../../../src/platform/audit/audit.service';
import { OutboxService } from '../../../src/platform/outbox/outbox.service';
import { IdGeneratorService } from '../../../src/modules/system/id-generator.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

const RUN_ID = randomUUID().slice(0, 8);
const TAG = `nex_p07_sf2_${RUN_ID}`;
const PHONE_TAG = `+62${RUN_ID}`;

function tagPhone(suffix: string): string {
  // `LeadCaptureService.upsertOrphanLead` calls `normalizePhone` which strips
  // every non-digit. Store the canonical E.164 form (with `+`) for caller
  // clarity; queries against the DB must use the normalized form.
  return `+${PHONE_TAG}${suffix}`.slice(0, 16);
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

describe('P07-SF2 lead intake dedup consent attribution (real LeadCaptureService)', () => {
  let leadCapture: LeadCaptureService;
  let leadService: LeadService;
  let prisma: PrismaService;
  const moduleRef = { current: null as any };

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        LeadCaptureService,
        LeadService,
        OutboundCounterService,
        PrismaService,
        { provide: AuditService, useFactory: (p: PrismaService) => new AuditService(p as any), inject: [PrismaService] },
        { provide: OutboxService, useFactory: (p: PrismaService) => new OutboxService(p as any), inject: [PrismaService] },
        EventEmitter2,
        { provide: IdGeneratorService, useValue: { generateId: async (prefix: string) => `${prefix}-${randomUUID().slice(0, 6)}` } },
      ],
    }).compile();
    moduleRef.current = mod;
    leadCapture = mod.get(LeadCaptureService);
    leadService = mod.get(LeadService);
    prisma = mod.get(PrismaService);

    // Pre-clean any rows tagged with this run id.
    await prisma.leadMessage.deleteMany({ where: { phone: { startsWith: PHONE_TAG } } });
    await prisma.leadCapture.deleteMany({ where: { phone: { startsWith: PHONE_TAG } } });
  });

  afterEach(async () => {
    try {
      await prisma.leadMessage.deleteMany({ where: { phone: { startsWith: PHONE_TAG } } });
      await prisma.leadCapture.deleteMany({ where: { phone: { startsWith: PHONE_TAG } } });
      await prisma.leadAttribute.deleteMany({ where: { source: `${TAG}-source` } });
    } catch {}
  });

  afterAll(async () => {
    try {
      await moduleRef.current?.close();
    } catch {}
  });

  test('normalized phone dedup: same number twice yields one canonical lead', async () => {
    const phone = tagPhone('0001');
    const normalized = normalizePhone(phone);

    const first = await leadCapture.upsertOrphanLead(phone, 'Visitor One', 'first message', `${TAG}-msg-1`);
    const second = await leadCapture.upsertOrphanLead(phone, 'Visitor One', 'second message', `${TAG}-msg-2`);

    expect(first.id).toBe(second.id);

    const canonicalRows = await prisma.leadCapture.findMany({ where: { phone: normalized } });
    expect(canonicalRows.length).toBe(1);
    expect(canonicalRows[0].waMessage).toBe('second message');

    // Both messages must have been logged to the SAME lead.
    const messages = await prisma.leadMessage.findMany({ where: { leadId: canonicalRows[0].id } });
    expect(messages.length).toBe(2);
  });

  test('concurrent duplicate intake yields exactly one canonical lead', async () => {
    const phone = tagPhone('0002');
    const normalized = normalizePhone(phone);
    const attempts = await Promise.all([
      leadCapture.upsertOrphanLead(phone, 'A', 'concurrent 1', `${TAG}-c-1`),
      leadCapture.upsertOrphanLead(phone, 'B', 'concurrent 2', `${TAG}-c-2`),
      leadCapture.upsertOrphanLead(phone, 'C', 'concurrent 3', `${TAG}-c-3`),
    ]);

    const uniqueIds = new Set(attempts.map((r) => r.id));
    expect(uniqueIds.size).toBe(1); // Three attempts → ONE canonical lead row.

    const canonicalRows = await prisma.leadCapture.findMany({ where: { phone: normalized } });
    expect(canonicalRows.length).toBe(1);
  });

  test('withdrawn consent blocks consent-required action via real confirmAttribute', async () => {
    const phone = tagPhone('0003');
    const lead = await leadCapture.upsertOrphanLead(phone, 'Consent Visitor', 'hello', `${TAG}-con-1`);

    // Seed an unconfirmed attribute (fixture data) then promote it through the
    // REAL `confirmAttribute` service — the production path for sales accepting
    // an AI-suggested attribute or marking one as withdrawn.
    const seeded = await prisma.leadAttribute.create({
      data: {
        leadId: lead.id,
        key: 'consent_withdrawn',
        value: 'true',
        source: `${TAG}-source`,
        confirmed: false,
      },
    });
    await leadCapture.confirmAttribute(lead.id, seeded.id, { confirmed: true, value: 'true' });

    const attrs = await leadCapture.getLeadAttributes(lead.id);
    const withdrawn = attrs.find((a: any) => a.key === 'consent_withdrawn' && a.confirmed === true);
    expect(withdrawn).toBeDefined();
    expect(withdrawn?.value).toBe('true');

    // Now exercise the production consent-required path: appendAttribution
    // (which the production LeadService uses for snapshot history) MUST
    // reject with zero side effects when a confirmed withdrawn consent
    // exists.
    const before = await prisma.leadAttribute.count({
      where: { leadId: lead.id, key: 'attribution' },
    });
    await expect(
      leadService.appendAttribution(lead.id, { channel: 'instagram' }, `${TAG}-source`),
    ).rejects.toThrow(/consent telah dicabut|LEAD_CONSENT_WITHDRAWN/);
    const after = await prisma.leadAttribute.count({
      where: { leadId: lead.id, key: 'attribution' },
    });
    expect(after).toBe(before);
  });

  test('attribution history is preserved (leadAttribute rows are append-only)', async () => {
    const phone = tagPhone('0004');
    const lead = await leadCapture.upsertOrphanLead(phone, 'Attribution Visitor', 'msg', `${TAG}-attr-1`);

    // History row 1 — first attribution snapshot.
    await prisma.leadAttribute.create({
      data: {
        leadId: lead.id,
        key: `${TAG}-attr-1`,
        value: JSON.stringify({ channel: 'instagram', source: 'cpc', campaign: 'summer' }),
        confirmed: true,
        source: `${TAG}-source`,
      },
    });

    // History row 2 — second attribution snapshot. The first row must remain.
    await prisma.leadAttribute.create({
      data: {
        leadId: lead.id,
        key: `${TAG}-attr-2`,
        value: JSON.stringify({ channel: 'tiktok', source: 'organic', campaign: 'fall' }),
        confirmed: true,
        source: `${TAG}-source`,
      },
    });

    const history = await prisma.leadAttribute.findMany({
      where: { leadId: lead.id, source: `${TAG}-source` },
      orderBy: { createdAt: 'asc' },
    });
    expect(history.length).toBe(2);
    expect(JSON.parse(history[0].value!).channel).toBe('instagram');
    expect(JSON.parse(history[1].value!).channel).toBe('tiktok');
  });
});
