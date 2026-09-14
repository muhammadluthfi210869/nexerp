/**
 * Unit test — LeadCapture new fields + LeadValidationLog
 * Verifies schema migration: waProfileName rename + new AI validation fields.
 * Uses PrismaService directly (not mocked) against erp_db_test.
 */
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

describe('LeadCapture new fields', () => {
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();
    prisma = module.get(PrismaService);
    // Clean up test rows
    await prisma.leadCapture.deleteMany({ where: { phone: '+6281234567890' } });
  });

  afterEach(async () => {
    await prisma.leadCapture.deleteMany({ where: { phone: '+6281234567890' } });
  });

  it('has waProfileName field (renamed from waName)', async () => {
    const lead = await prisma.leadCapture.create({
      data: {
        phone: '+6281234567890',
        trackingCode: 'TEST-001',
        waProfileName: 'Ahmad',
      },
    });
    expect(lead.waProfileName).toBe('Ahmad');
  });

  it('has new AI validation fields', async () => {
    const lead = await prisma.leadCapture.create({
      data: {
        phone: '+6281234567890',
        trackingCode: 'TEST-002',
        extractedFullName: 'Ahmad Wijaya',
        nameConfidence: 0.92,
        nameMatch: true,
        approvalNeeded: false,
        aiIntent: 'PROSPEK',
        outboundReplyCount: 0,
      },
    });
    expect(lead.extractedFullName).toBe('Ahmad Wijaya');
    expect(lead.nameConfidence).toBe(0.92);
    expect(lead.nameMatch).toBe(true);
    expect(lead.approvalNeeded).toBe(false);
    expect(lead.aiIntent).toBe('PROSPEK');
    expect(lead.outboundReplyCount).toBe(0);
  });

  it('has firstValidatedAt', async () => {
    const now = new Date();
    const lead = await prisma.leadCapture.create({
      data: {
        phone: '+6281234567890',
        trackingCode: 'TEST-003',
        firstValidatedAt: now,
      },
    });
    expect(lead.firstValidatedAt).toBeInstanceOf(Date);
  });

  it('can create LeadValidationLog with relation', async () => {
    const lead = await prisma.leadCapture.create({
      data: {
        phone: '+6281234567890',
        trackingCode: 'TEST-004',
      },
    });

    const log = await prisma.leadValidationLog.create({
      data: {
        leadId: lead.id,
        type: 'INTENT',
        input: 'Halo saya mau tanya',
        output: '{"intent":"PROSPEK","confidence":0.9}',
        confidence: 0.9,
        action: 'SAVED',
      },
    });

    expect(log.id).toBeDefined();
    expect(log.leadId).toBe(lead.id);
    expect(log.type).toBe('INTENT');
  });
});
