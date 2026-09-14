import { Test } from '@nestjs/testing';
import { LeadCaptureService } from '../lead-capture.service';
import { OutboundCounterService } from '../outbound-counter.service';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

const mockFetch = (responses: Map<string, any>) => {
  const original = globalThis.fetch;
  (globalThis as any).fetch = async (url: string) => {
    const key = url.toString();
    if (responses.has(key)) {
      const body = responses.get(key);
      return { ok: true, json: async () => body } as any;
    }
    return original(url);
  };
  return original;
};

describe('Lead validation E2E', () => {
  let leadCapture: LeadCaptureService;
  let counter: OutboundCounterService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [LeadCaptureService, OutboundCounterService, PrismaService],
    }).compile();
    leadCapture = module.get(LeadCaptureService);
    counter = module.get(OutboundCounterService);
    prisma = module.get(PrismaService);

    // Clean up test leads
    await prisma.leadCapture.deleteMany({ where: { phone: '+6289000000999' } });
  });

  afterEach(async () => {
    await prisma.leadCapture.deleteMany({ where: { phone: '+6289000000999' } });
  });

  it('classifyIntent accepts skincare prospect', async () => {
    const responses = new Map([
      [
        'undefined/chat/completions',
        {
          choices: [
            {
              message: {
                content:
                  '{"intent":"PROSPEK","confidence":0.92,"reasoning":"calon customer nyata"}',
              },
            },
          ],
        },
      ],
    ]);
    const restore = mockFetch(responses);
    try {
      const result = await leadCapture.classifyIntent(
        'Halo, saya mau tanya soal maklon skincare untuk brand saya',
      );
      expect(result.intent).toBe('PROSPEK');
      expect(result.confidence).toBeGreaterThan(0.5);
    } finally {
      (globalThis as any).fetch = restore;
    }
  });

  it('classifyIntent rejects junk message', async () => {
    const result = await leadCapture.classifyIntent('test doang ini');
    expect(['SPAM', 'JUNK', 'UNCLEAR']).toContain(result.intent);
  });

  it('extractName finds name in conversation', async () => {
    const responses = new Map([
      [
        'undefined/chat/completions',
        {
          choices: [
            { message: { content: '{"name":"Siti","confidence":0.92}' } },
          ],
        },
      ],
    ]);
    const restore = mockFetch(responses);
    try {
      const result = await leadCapture.extractName(
        'Halo, nama saya Siti dari Jakarta',
      );
      expect(result.name).toBe('Siti');
      expect(result.confidence).toBeGreaterThan(0.85);
    } finally {
      (globalThis as any).fetch = restore;
    }
  });

  it('extractName returns null for product inquiry without name', async () => {
    const responses = new Map([
      [
        'undefined/chat/completions',
        {
          choices: [{ message: { content: '{"name":null,"confidence":0.0}' } }],
        },
      ],
    ]);
    const restore = mockFetch(responses);
    try {
      const result = await leadCapture.extractName(
        'Berapa harga maklon skincare? MOQ berapa?',
      );
      expect(result.name).toBeNull();
    } finally {
      (globalThis as any).fetch = restore;
    }
  });

  it('outbound counter transitions NEW_LEAD → COLD → WARM', async () => {
    const lead = await prisma.leadCapture.create({
      data: {
        phone: '+6289000000999',
        trackingCode: 'E2E-001',
        workflowStatus: 'NEW_LEAD',
      },
    });

    // Reply 1 → COLD
    await counter.recordBusdevReply(lead.id);
    let l = await prisma.leadCapture.findUnique({ where: { id: lead.id } });
    expect(l!.outboundReplyCount).toBe(1);
    expect(l!.workflowStatus).toBe('COLD');

    // Reply 5 → WARM
    for (let i = 0; i < 4; i++) {
      await counter.recordBusdevReply(lead.id);
    }
    l = await prisma.leadCapture.findUnique({ where: { id: lead.id } });
    expect(l!.outboundReplyCount).toBe(5);
    expect(l!.workflowStatus).toBe('WARM');

    // Reply 10 → stays WARM (no HOT auto)
    for (let i = 0; i < 5; i++) {
      await counter.recordBusdevReply(lead.id);
    }
    l = await prisma.leadCapture.findUnique({ where: { id: lead.id } });
    expect(l!.outboundReplyCount).toBe(10);
    expect(l!.workflowStatus).toBe('WARM');
  });
});
