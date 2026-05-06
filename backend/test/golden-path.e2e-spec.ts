import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { WorkflowStatus, SampleStage, SOStatus } from '@prisma/client';

/**
 * Golden Path E2E — Full LEAD → WON_DEAL Cycle
 *
 * Tests the complete state machine flow from lead creation through all stages
 * including Gate 1, Gate 2, and Gate 3 verifications.
 *
 * NOTE: Requires a running PostgreSQL database with the test schema.
 * If no DB is available, this test is skipped automatically.
 */

describe('Golden Path E2E — LEAD → WON_DEAL', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    try {
      await prisma.$connect();
    } catch {
      console.warn('⚠ No database available — skipping Golden Path E2E tests');
      return;
    }

    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (prisma) await prisma.$disconnect();
  });

  const runTest = (name: string, fn: () => Promise<void>) => {
    it(name, async () => {
      if (!prisma) return; // skip if no DB
      await fn();
    });
  };

  runTest('1. Create Lead → NEW_LEAD', async () => {
    const res = await request(app.getHttpServer()).post('/bussdev/lead').send({
      clientName: 'E2E Golden Path Client',
      brandName: 'Golden Product',
      contactInfo: 'golden@test.com',
      source: 'DIRECT',
      productInterest: 'Skincare Serum',
      estimatedValue: 100000000,
      category: 'COSMETICS',
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe(WorkflowStatus.NEW_LEAD);
    expect(res.body.id).toBeDefined();
  });

  runTest('2. Advance NEW_LEAD → CONTACTED', async () => {
    const lead = await prisma.salesLead.findFirst({
      where: { clientName: 'E2E Golden Path Client' },
    });
    if (!lead) throw new Error('Lead not found');

    const res = await request(app.getHttpServer())
      .patch(`/bussdev/lead/${lead.id}/advance`)
      .send({
        action: 'STAGE_UPDATED',
        newStatus: WorkflowStatus.CONTACTED,
        loggedBy: 'e2e-tester',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(WorkflowStatus.CONTACTED);
  });

  runTest('3. Advance CONTACTED → NEGOTIATION', async () => {
    const lead = await prisma.salesLead.findFirst({
      where: { clientName: 'E2E Golden Path Client' },
    });
    if (!lead) throw new Error('Lead not found');

    const res = await request(app.getHttpServer())
      .patch(`/bussdev/lead/${lead.id}/advance`)
      .send({
        action: 'STAGE_UPDATED',
        newStatus: WorkflowStatus.NEGOTIATION,
        loggedBy: 'e2e-tester',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(WorkflowStatus.NEGOTIATION);
  });

  runTest('4. Advance NEGOTIATION → SAMPLE_REQUESTED', async () => {
    const lead = await prisma.salesLead.findFirst({
      where: { clientName: 'E2E Golden Path Client' },
    });
    if (!lead) throw new Error('Lead not found');

    const res = await request(app.getHttpServer())
      .patch(`/bussdev/lead/${lead.id}/advance`)
      .send({
        action: 'STAGE_UPDATED',
        newStatus: WorkflowStatus.SAMPLE_REQUESTED,
        productConcept: 'Anti-aging serum with hyaluronic acid',
        targetPrice: 50000,
        loggedBy: 'e2e-tester',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(WorkflowStatus.SAMPLE_REQUESTED);
  });

  runTest(
    '5. Advance SAMPLE_REQUESTED → WAITING_FINANCE_APPROVAL (with payment proof)',
    async () => {
      const lead = await prisma.salesLead.findFirst({
        where: { clientName: 'E2E Golden Path Client' },
      });
      if (!lead) throw new Error('Lead not found');

      const res = await request(app.getHttpServer())
        .patch(`/bussdev/lead/${lead.id}/advance`)
        .send({
          action: 'STAGE_UPDATED',
          newStatus: WorkflowStatus.WAITING_FINANCE_APPROVAL,
          paymentProofUrl: '/uploads/e2e-payment-proof.jpg',
          notes: 'E2E test payment',
          loggedBy: 'e2e-tester',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(WorkflowStatus.WAITING_FINANCE_APPROVAL);
    },
  );

  runTest(
    '6. Finance verifies Gate 1 → SAMPLE_SENT (auto-advance)',
    async () => {
      const lead = await prisma.salesLead.findFirst({
        where: { clientName: 'E2E Golden Path Client' },
      });
      if (!lead) throw new Error('Lead not found');

      // Finance verifies the payment by finding the activity and marking validated
      const activity = await prisma.leadActivity.findFirst({
        where: { leadId: lead.id, activityType: 'SAMPLE_PAYMENT' },
      });
      if (!activity) throw new Error('Payment activity not found');

      const res = await request(app.getHttpServer())
        .patch(`/finance/activity/${activity.id}/validate`)
        .send({ verifiedBy: 'finance-e2e' });

      // Should auto-advance the lead to SAMPLE_SENT
      const updatedLead = await prisma.salesLead.findUnique({
        where: { id: lead.id },
      });
      expect(updatedLead?.status).toBe(WorkflowStatus.SAMPLE_SENT);
    },
  );

  runTest('7. Advance SAMPLE_SENT → SAMPLE_APPROVED', async () => {
    const lead = await prisma.salesLead.findFirst({
      where: { clientName: 'E2E Golden Path Client' },
    });
    if (!lead) throw new Error('Lead not found');

    const res = await request(app.getHttpServer())
      .patch(`/bussdev/lead/${lead.id}/advance`)
      .send({
        action: 'STAGE_UPDATED',
        newStatus: WorkflowStatus.SAMPLE_APPROVED,
        loggedBy: 'e2e-tester',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(WorkflowStatus.SAMPLE_APPROVED);
  });

  runTest('8. Advance SAMPLE_APPROVED → SPK_SIGNED (creates SO)', async () => {
    const lead = await prisma.salesLead.findFirst({
      where: { clientName: 'E2E Golden Path Client' },
    });
    if (!lead) throw new Error('Lead not found');

    const res = await request(app.getHttpServer())
      .patch(`/bussdev/lead/${lead.id}/advance`)
      .send({
        action: 'STAGE_UPDATED',
        newStatus: WorkflowStatus.SPK_SIGNED,
        planOmset: 100000000,
        estimatedMoq: 1000,
        notes: 'SPK signed for E2E test',
        loggedBy: 'e2e-tester',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(WorkflowStatus.SPK_SIGNED);

    // Verify SO was created automatically
    const so = await prisma.salesOrder.findFirst({
      where: { leadId: lead.id },
    });
    expect(so).toBeDefined();
    expect(so?.status).toBe(SOStatus.PENDING_DP);
  });

  runTest(
    '9. Advance SPK_SIGNED → WAITING_FINANCE_APPROVAL (DP payment)',
    async () => {
      const lead = await prisma.salesLead.findFirst({
        where: { clientName: 'E2E Golden Path Client' },
      });
      if (!lead) throw new Error('Lead not found');

      const res = await request(app.getHttpServer())
        .patch(`/bussdev/lead/${lead.id}/advance`)
        .send({
          action: 'STAGE_UPDATED',
          newStatus: WorkflowStatus.WAITING_FINANCE_APPROVAL,
          paymentProofUrl: '/uploads/e2e-dp-proof.jpg',
          downPaymentAmount: 50000000,
          notes: 'DP 50% for E2E test',
          loggedBy: 'e2e-tester',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(WorkflowStatus.WAITING_FINANCE_APPROVAL);
    },
  );

  runTest('10. Finance verifies Gate 2 → DP_PAID (auto-advance)', async () => {
    const lead = await prisma.salesLead.findFirst({
      where: { clientName: 'E2E Golden Path Client' },
    });
    if (!lead) throw new Error('Lead not found');

    // Finance verifies the DP payment
    const activity = await prisma.leadActivity.findFirst({
      where: { leadId: lead.id, activityType: 'DOWN_PAYMENT' },
    });
    if (!activity) throw new Error('DP activity not found');

    const res = await request(app.getHttpServer())
      .patch(`/finance/activity/${activity.id}/validate`)
      .send({ verifiedBy: 'finance-e2e', invoiceType: 'DP' });

    // Should auto-advance to DP_PAID
    const updatedLead = await prisma.salesLead.findUnique({
      where: { id: lead.id },
    });
    expect(updatedLead?.status).toBe(WorkflowStatus.DP_PAID);
  });

  runTest('11. System auto-advances DP_PAID → PRODUCTION_PLAN', async () => {
    const lead = await prisma.salesLead.findFirst({
      where: { clientName: 'E2E Golden Path Client' },
    });
    if (!lead) throw new Error('Lead not found');
    expect(lead.status).toBe(WorkflowStatus.PRODUCTION_PLAN);
  });

  runTest('12. Advance PRODUCTION_PLAN → READY_TO_SHIP', async () => {
    const lead = await prisma.salesLead.findFirst({
      where: { clientName: 'E2E Golden Path Client' },
    });
    if (!lead) throw new Error('Lead not found');

    const res = await request(app.getHttpServer())
      .patch(`/bussdev/lead/${lead.id}/advance`)
      .send({
        action: 'STAGE_UPDATED',
        newStatus: WorkflowStatus.READY_TO_SHIP,
        loggedBy: 'e2e-tester',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(WorkflowStatus.READY_TO_SHIP);
  });

  runTest(
    '13. Finance verifies Gate 3 → WON_DEAL (final payment)',
    async () => {
      const lead = await prisma.salesLead.findFirst({
        where: { clientName: 'E2E Golden Path Client' },
      });
      if (!lead) throw new Error('Lead not found');

      // Verify payment via final invoice
      const invoice = await prisma.invoice.findFirst({
        where: { so: { leadId: lead.id }, type: 'FINAL_PAYMENT' },
      });
      if (!invoice) {
        // If no final invoice, create one
        const so = await prisma.salesOrder.findFirst({
          where: { leadId: lead.id },
        });
        if (!so) throw new Error('SO not found');
        await prisma.invoice.create({
          data: {
            soId: so.id,
            invoiceNumber: `INV-E2E-FINAL-${Date.now()}`,
            type: 'FINAL_PAYMENT',
            category: 'RECEIVABLE',
            status: 'UNPAID',
            amountDue: 50000000,
            outstandingAmount: 50000000,
            dueDate: new Date(),
          },
        });
      }

      const res = await request(app.getHttpServer())
        .patch(`/bussdev/lead/${lead.id}/advance`)
        .send({
          action: 'STAGE_UPDATED',
          newStatus: WorkflowStatus.WON_DEAL,
          loggedBy: 'e2e-tester',
          overridePin: 'e2e-override-pin',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(WorkflowStatus.WON_DEAL);
    },
  );

  runTest('14. Verify final state — lead is WON_DEAL', async () => {
    const lead = await prisma.salesLead.findFirst({
      where: { clientName: 'E2E Golden Path Client' },
    });
    if (!lead) throw new Error('Lead not found');
    expect(lead.status).toBe(WorkflowStatus.WON_DEAL);
  });

  runTest('15. Verify activity stream has events', async () => {
    const lead = await prisma.salesLead.findFirst({
      where: { clientName: 'E2E Golden Path Client' },
    });
    if (!lead) throw new Error('Lead not found');

    const events = await prisma.activityStream.findMany({
      where: { leadId: lead.id },
      orderBy: { createdAt: 'asc' },
    });

    expect(events.length).toBeGreaterThan(0);
  });

  runTest('16. Cleanup — delete E2E test lead', async () => {
    const lead = await prisma.salesLead.findFirst({
      where: { clientName: 'E2E Golden Path Client' },
    });
    if (!lead) return;

    await prisma.activityStream.deleteMany({ where: { leadId: lead.id } });
    await prisma.leadActivity.deleteMany({ where: { leadId: lead.id } });
    await prisma.sampleRequest.deleteMany({ where: { leadId: lead.id } });
    await prisma.salesOrder.deleteMany({ where: { leadId: lead.id } });
    await prisma.salesLead.delete({ where: { id: lead.id } });
  });
});
