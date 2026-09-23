import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP09App, P09App, p09Message } from './p09-http-harness';
import { UserRole, SOStatus } from '@prisma/client';

describe('P09 - S2: Down Payment Policy & SO Unlocking', () => {
  let p09: P09App;
  let adminToken: string;
  let commercialToken: string;
  let tenantId: string;
  let leadId: string;
  let sampleId: string;
  let soId: string;
  let sampleFeeId: string;

  const testPrefix = `nex_p09_s2_${Date.now()}`;

  beforeAll(async () => {
    p09 = await bootP09App();
    tenantId = randomUUID();

    const admin = await p09.createUser(`${testPrefix}_admin`, [UserRole.SUPER_ADMIN], tenantId);
    const comm = await p09.createUser(`${testPrefix}_comm`, [UserRole.COMMERCIAL], tenantId);

    adminToken = admin.token;
    commercialToken = comm.token;

    const bdStaff = await p09.prisma.bussdevStaff.create({
      data: { name: `${testPrefix}_Staff` },
    });

    const lead = await p09.prisma.salesLead.create({
      data: {
        clientName: `${testPrefix}_Client`,
        contactInfo: '08123456781',
        source: 'DIRECT',
        productInterest: 'Sunscreen',
        picId: bdStaff.id,
        organizationId: tenantId,
      },
    });
    leadId = lead.id;

    const sample = await p09.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-${Date.now()}`,
        leadId: lead.id,
        productName: `${testPrefix}_SunscreenSample`,
        targetFunction: 'Sun Protection',
        textureReq: 'Lotion',
        colorReq: 'White',
        aromaReq: 'Coconut',
        stage: 'QUEUE',
      },
    });
    sampleId = sample.id;

    // Create a verified Sample Fee for offset testing (BUS-RULE-008)
    const sampleFee = await p09.prisma.sampleFee.create({
      data: {
        feeNumber: `SF-${Date.now()}`,
        customerId: lead.id,
        amount: 5000000, // Rp 5,000,000 sample fee
        feeDate: new Date(),
      },
    });
    sampleFeeId = sampleFee.id;

    // Create SO totaling Rp 100,000,000 (so 50% minimum = Rp 50,000,000)
    const so = await p09.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-${Date.now()}`,
        organizationId: tenantId,
        leadId: lead.id,
        sampleId: sample.id,
        salesCategory: 'PRODUKSI',
        brandName: 'Solar Glow',
        totalAmount: 100000000,
        status: SOStatus.PENDING_DP,
      },
    });
    soId = so.id;
  }, 120000);

  afterAll(async () => {
    try {
      await p09.prisma.payment.deleteMany({
        where: { invoice: { soId } },
      });
      await p09.prisma.invoice.deleteMany({
        where: { soId },
      });
      await p09.prisma.salesOrder.deleteMany({
        where: { id: soId },
      });
      await p09.prisma.sampleFee.deleteMany({
        where: { id: sampleFeeId },
      });
      await p09.prisma.sampleRequest.deleteMany({
        where: { id: sampleId },
      });
      await p09.prisma.salesLead.deleteMany({
        where: { id: leadId },
      });
      await p09.prisma.bussdevStaff.deleteMany({
        where: { name: `${testPrefix}_Staff` },
      });
      await p09.prisma.notification.deleteMany({
        where: { user: { email: { contains: testPrefix.toLowerCase().replace(/[^a-z0-9]/g, '_') } } },
      });
      await p09.prisma.user.deleteMany({
        where: { email: { contains: testPrefix.toLowerCase().replace(/[^a-z0-9]/g, '_') } },
      });
    } catch (e) {
      // Ignore cleanup error
    }
    await p09.app.close();
  });

  it('1. rejects DP creation without valid category (BUS-RULE-004)', async () => {
    const res = await request(p09.app.getHttpServer())
      .post('/commercial/down-payments')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        soId,
        category: 'INVALID_CATEGORY',
        amount: 50000000,
      });

    expect(res.status).toBe(400);
    expect(p09Message(res.body)).toContain('DP_CATEGORY_REQUIRED');
  });

  it('2. rejects DP < 50% for PRODUKSI category (BUS-RULE-002)', async () => {
    // Total is 100M, 50% is 50M. Attempt to pay 40M without offset.
    const res = await request(p09.app.getHttpServer())
      .post('/commercial/down-payments')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        soId,
        category: 'PRODUKSI',
        amount: 40000000, // Only 40%
      });

    expect(res.status).toBe(400);
    expect(p09Message(res.body)).toContain('DP_MINIMUM_NOT_MET');
  });

  it('3. accepts DP with sample fee offset satisfying 50% minimum (BUS-RULE-008)', async () => {
    // 45M cash + 5M sample fee offset = 50M (50% exact threshold)
    const res = await request(p09.app.getHttpServer())
      .post('/commercial/down-payments')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        soId,
        category: 'PRODUKSI',
        amount: 45000000,
        applySampleFeeOffset: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.dpNumber).toMatch(/^DPJ-/);
    expect(res.body.sampleFeeOffset).toBe(5000000);
    expect(res.body.totalDpReceived).toBe(50000000);
    expect(res.body.salesOrderStatus).toBe(SOStatus.ACTIVE);

    // Verify sample fee is now linked to DP invoice (offset)
    const fee = await p09.prisma.sampleFee.findUnique({
      where: { id: sampleFeeId },
    });
    expect(fee?.offsetToDPId).toBeTruthy();
  });

  it('4. rejects reusing already offset sample fee (BUS-RULE-008)', async () => {
    // Create another SO
    const so2 = await p09.prisma.salesOrder.create({
      data: {
        orderNumber: `SO2-${Date.now()}`,
        organizationId: tenantId,
        leadId,
        sampleId,
        salesCategory: 'PRODUKSI',
        totalAmount: 50000000,
        status: SOStatus.PENDING_DP,
      },
    });

    const res = await request(p09.app.getHttpServer())
      .post('/commercial/down-payments')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        soId: so2.id,
        category: 'PRODUKSI',
        amount: 25000000,
        applySampleFeeOffset: true,
      });

    expect(res.status).toBe(400);
    expect(p09Message(res.body)).toContain('SAMPLE_FEE_ALREADY_OFFSET');

    await p09.prisma.salesOrder.delete({ where: { id: so2.id } });
  });

  it('5. lists down payments with category filter', async () => {
    const res = await request(p09.app.getHttpServer())
      .get('/commercial/down-payments')
      .set('Authorization', `Bearer ${commercialToken}`)
      .query({ soId });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].amount).toBeDefined();
    expect(res.body[0].code).toMatch(/^DPJ-/);
  });
});
