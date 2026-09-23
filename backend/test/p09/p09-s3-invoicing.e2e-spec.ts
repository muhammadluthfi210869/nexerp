import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP09App, P09App, p09Message } from './p09-http-harness';
import { UserRole, SOStatus, InvoiceType, InvoiceStatus } from '@prisma/client';

describe('P09 - S3: Invoicing & AR Delivery Gatekeeper', () => {
  let p09: P09App;
  let adminToken: string;
  let financeToken: string;
  let tenantId: string;
  let leadId: string;
  let sampleId: string;
  let soId: string;

  const testPrefix = `nex_p09_s3_${Date.now()}`;

  beforeAll(async () => {
    p09 = await bootP09App();
    tenantId = randomUUID();

    const admin = await p09.createUser(`${testPrefix}_admin`, [UserRole.SUPER_ADMIN], tenantId);
    const fin = await p09.createUser(`${testPrefix}_fin`, [UserRole.FINANCE], tenantId);

    adminToken = admin.token;
    financeToken = fin.token;

    const bdStaff = await p09.prisma.bussdevStaff.create({
      data: { name: `${testPrefix}_Staff` },
    });

    // Customer with planOmset / credit limit = Rp 50,000,000
    const lead = await p09.prisma.salesLead.create({
      data: {
        clientName: `${testPrefix}_CreditClient`,
        contactInfo: '08123456782',
        source: 'DIRECT',
        productInterest: 'Serum',
        picId: bdStaff.id,
        planOmset: 50000000, // 50M limit
        organizationId: tenantId,
      },
    });
    leadId = lead.id;

    const sample = await p09.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-${Date.now()}`,
        leadId: lead.id,
        productName: `${testPrefix}_Product`,
        targetFunction: 'Moisturizing',
        textureReq: 'Gel',
        colorReq: 'Clear',
        aromaReq: 'Rose',
        stage: 'QUEUE',
      },
    });
    sampleId = sample.id;

    const so = await p09.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-${Date.now()}`,
        organizationId: tenantId,
        leadId: lead.id,
        sampleId: sample.id,
        salesCategory: 'PRODUKSI',
        totalAmount: 100000000,
        status: SOStatus.ACTIVE,
        deliveryGateStatus: 'HELD',
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
    } catch (e) {}
    await p09.app.close();
  });

  it('1. rejects invoice date in the future (BUS-RULE-003)', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const res = await request(p09.app.getHttpServer())
      .post('/commercial/invoices')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        id: `INV-${Date.now()}-FUT`,
        soId,
        type: InvoiceType.FINAL_PAYMENT,
        amountDue: 50000000,
        invoiceDate: futureDate.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(p09Message(res.body)).toContain('INVOICE_DATE_FUTURE');
  });

  let createdInvoiceId: string;

  it('2. creates invoice successfully with valid custom date', async () => {
    const validPastDate = new Date();
    validPastDate.setDate(validPastDate.getDate() - 2);

    const res = await request(p09.app.getHttpServer())
      .post('/commercial/invoices')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        id: `INV-${Date.now()}-VALID`,
        soId,
        type: InvoiceType.FINAL_PAYMENT,
        amountDue: 25000000, // 25M <= 50M limit
        invoiceDate: validPastDate.toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(Number(res.body.amountDue)).toBe(25000000);

    createdInvoiceId = res.body.id;
  });

  it('3. releases delivery gate via invoice (BUS-RULE-006)', async () => {
    const res = await request(p09.app.getHttpServer())
      .post(`/commercial/invoices/${createdInvoiceId}/release-delivery`)
      .set('Authorization', `Bearer ${financeToken}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.deliveryGateStatus).toBe('RELEASED');

    // Verify SO now has RELEASED deliveryGateStatus
    const so = await p09.prisma.salesOrder.findUnique({
      where: { id: soId },
    });
    expect(so?.deliveryGateStatus).toBe('RELEASED');
  });

  it('4. rejects editing a paid/posted invoice (BUS-RULE-012)', async () => {
    // Mark invoice as PAID
    await p09.prisma.invoice.update({
      where: { id: createdInvoiceId },
      data: { status: InvoiceStatus.PAID },
    });

    const res = await request(p09.app.getHttpServer())
      .patch(`/commercial/invoices/${createdInvoiceId}`)
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        amountDue: 30000000,
      });

    expect(res.status).toBe(400);
    expect(p09Message(res.body)).toContain('POSTED_INVOICE_IMMUTABLE');
  });
});
