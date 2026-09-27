import request from 'supertest';
import { randomUUID } from 'crypto';
import { SOStatus, UserRole, InvoiceStatus, InvoiceType } from '@prisma/client';
import { bootP09App, p09Message, type P09App } from './p09-http-harness';

describe('P09 - S5: AR Settlement, PPh 23 Deduction & Sales Returns', () => {
  let p09: P09App;
  let tenantId: string;
  let financeToken: string;
  let commercialToken: string;
  let leadId: string;
  let sampleId: string;
  let materialId: string;
  let warehouseId: string;
  let soId: string;
  let invoiceId: string;

  const testPrefix = `nex_p09_s5_${Date.now()}`;

  beforeAll(async () => {
    p09 = await bootP09App();
    tenantId = randomUUID();

    const fin = await p09.createUser(`${testPrefix}_fin`, [UserRole.FINANCE], tenantId);
    const comm = await p09.createUser(`${testPrefix}_comm`, [UserRole.COMMERCIAL], tenantId);

    financeToken = fin.token;
    commercialToken = comm.token;

    const bdStaff = await p09.prisma.bussdevStaff.create({
      data: { name: `${testPrefix}_Staff` },
    });

    const lead = await p09.prisma.salesLead.create({
      data: {
        clientName: `${testPrefix}_Client`,
        contactInfo: '08123456785',
        source: 'DIRECT',
        productInterest: 'Serum',
        picId: bdStaff.id,
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
        aromaReq: 'Unscented',
        stage: 'QUEUE',
      },
    });
    sampleId = sample.id;

    const material = await p09.prisma.materialItem.create({
      data: {
        name: `${testPrefix}_Material`,
        type: 'RAW_MATERIAL',
        unit: 'PCS',
        unitPrice: 50000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 500,
      },
    });
    materialId = material.id;

    const wh = await p09.prisma.warehouse.create({
      data: {
        name: `${testPrefix}_Warehouse`,
        address: 'Test Warehouse Address',
      },
    });
    warehouseId = wh.id;

    const so = await p09.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-${Date.now()}`,
        organizationId: tenantId,
        leadId: lead.id,
        sampleId: sample.id,
        salesCategory: 'PRODUKSI',
        totalAmount: 100000000,
        status: SOStatus.ACTIVE,
        deliveryGateStatus: 'RELEASED',
      },
    });
    soId = so.id;

    // Create Invoice for Rp 50,000,000
    const inv = await p09.prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}`,
        category: 'RECEIVABLE',
        soId: so.id,
        type: InvoiceType.FINAL_PAYMENT,
        amountDue: 50000000,
        outstandingAmount: 50000000,
        status: InvoiceStatus.UNPAID,
        dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
    });
    invoiceId = inv.id;
  }, 120000);

  afterAll(async () => {
    try {
      await p09.prisma.payment.deleteMany({
        where: { invoice: { soId } },
      });
      await p09.prisma.journalEntry.deleteMany({
        where: { soId },
      });
      await p09.prisma.salesReturnItem.deleteMany({
        where: { return: { soId } },
      });
      await p09.prisma.salesReturn.deleteMany({
        where: { soId },
      });
      await p09.prisma.invoice.deleteMany({
        where: { soId },
      });
      await p09.prisma.salesOrder.deleteMany({
        where: { id: soId },
      });
      await p09.prisma.warehouse.deleteMany({
        where: { id: warehouseId },
      });
      await p09.prisma.materialItem.deleteMany({
        where: { id: materialId },
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

  it('1. rejects payment when PPh 23 deduction exceeds invoice outstanding (BUS-RULE-007)', async () => {
    const res = await request(p09.app.getHttpServer())
      .post('/commercial/payments')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        invoiceId,
        amountPaid: 10000000,
        pph23Deduction: 60000000, // exceeds 50,000,000 outstanding!
      });

    expect(res.status).toBe(400);
    expect(p09Message(res.body)).toContain('PPH23_EXCEEDS_INVOICE');
  });

  it('2. processes payment with valid PPh 23 deduction and reduces AR balance (BUS-RULE-007)', async () => {
    // Invoice outstanding: 50,000,000
    // Pay: 20,000,000 + PPh 23 deduction 1,000,000 (2% of some portion) = 21,000,000 effective
    // Remaining outstanding: 29,000,000 (PARTIAL)
    const res = await request(p09.app.getHttpServer())
      .post('/commercial/payments')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        invoiceId,
        amountPaid: 20000000,
        pph23Deduction: 1000000,
      });

    expect(res.status).toBe(201);
    expect(res.body.effectivePaid).toBe(21000000);
    expect(res.body.outstandingAmount).toBe(29000000);
    expect(res.body.invoiceStatus).toBe(InvoiceStatus.PARTIAL);
  });

  it('3. handles customer overpayment by setting invoice to PAID and crediting excess (BUS-RULE-015)', async () => {
    // Current outstanding: 29,000,000
    // Pay: 35,000,000 (overpayment of 6,000,000)
    const res = await request(p09.app.getHttpServer())
      .post('/commercial/payments')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        invoiceId,
        amountPaid: 35000000,
      });

    expect(res.status).toBe(201);
    expect(res.body.outstandingAmount).toBe(0);
    expect(res.body.overpayment).toBe(6000000);
    expect(res.body.arSettled).toBe(29000000);
    expect(res.body.invoiceStatus).toBe(InvoiceStatus.PAID);
  });

  it('4. creates Sales Return and generates Credit Note journal without altering original invoice (BUS-RULE-012)', async () => {
    const res = await request(p09.app.getHttpServer())
      .post('/bussdev/returns')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        soId,
        warehouseId,
        notes: 'Damaged packaging during transit',
        returnStatus: 'POTONG_TAGIHAN',
        items: [
          {
            materialId,
            qtyReturned: 20,
            unitPrice: 50000,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.returnStatus).toBe('POTONG_TAGIHAN');

    // Verify original invoice was NOT altered / rewritten (remains PAID per BUS-RULE-012)
    const originalInv = await p09.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    expect(originalInv?.status).toBe(InvoiceStatus.PAID);

    // Verify Credit Note journal entry was generated
    const cnJournal = await p09.prisma.journalEntry.findFirst({
      where: {
        soId,
        sourceDocumentType: 'SALES_RETURN',
      },
      include: { lines: true },
    });
    expect(cnJournal).toBeDefined();
    expect(cnJournal?.reference).toMatch(/^CN-/);
  });
});
