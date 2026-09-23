import request from 'supertest';
import { randomUUID } from 'crypto';
import { SOStatus, UserRole, InvoiceStatus, InvoiceType, ShipStatus } from '@prisma/client';
import { bootP09App, p09Message, type P09App } from './p09-http-harness';

describe('P09 — Golden Thread Commercial Lifecycle', () => {
  let p09: P09App;
  let tenantId: string;
  let adminToken: string;
  let commercialToken: string;
  let financeToken: string;
  let warehouseToken: string;

  let leadId: string;
  let sampleId: string;
  let materialId: string;
  let warehouseId: string;
  let logisticsUserId: string;

  let soId: string;
  let dpInvoiceId: string;
  let finalInvoiceId: string;
  let shipmentId: string;
  let sampleFeeId: string;

  const testPrefix = `nex_p09_gt_${Date.now()}`;

  beforeAll(async () => {
    p09 = await bootP09App();
    tenantId = randomUUID();

    const admin = await p09.createUser(`${testPrefix}_admin`, [UserRole.SUPER_ADMIN], tenantId);
    const comm = await p09.createUser(`${testPrefix}_comm`, [UserRole.COMMERCIAL], tenantId);
    const fin = await p09.createUser(`${testPrefix}_fin`, [UserRole.FINANCE], tenantId);
    const wh = await p09.createUser(`${testPrefix}_wh`, [UserRole.WAREHOUSE], tenantId);

    adminToken = admin.token;
    commercialToken = comm.token;
    financeToken = fin.token;
    warehouseToken = wh.token;
    logisticsUserId = wh.user.id;

    const bdStaff = await p09.prisma.bussdevStaff.create({
      data: { name: `${testPrefix}_Staff` },
    });

    const lead = await p09.prisma.salesLead.create({
      data: {
        clientName: `${testPrefix}_GoldenClient`,
        contactInfo: '08129876543',
        source: 'DIRECT',
        productInterest: 'Acne Cream',
        picId: bdStaff.id,
        organizationId: tenantId,
      },
    });
    leadId = lead.id;

    const sample = await p09.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-${Date.now()}`,
        leadId: lead.id,
        productName: `${testPrefix}_Sample`,
        targetFunction: 'Acne Care',
        textureReq: 'Cream',
        colorReq: 'White',
        aromaReq: 'Tea Tree',
        stage: 'QUEUE',
      },
    });
    sampleId = sample.id;

    const material = await p09.prisma.materialItem.create({
      data: {
        name: `${testPrefix}_CreamMaterial`,
        type: 'RAW_MATERIAL',
        unit: 'JAR',
        unitPrice: 50000,
        minLevel: 10,
        maxLevel: 2000,
        reorderPoint: 100,
        stockQty: 1000,
      },
    });
    materialId = material.id;

    const whEntity = await p09.prisma.warehouse.create({
      data: {
        name: `${testPrefix}_Warehouse`,
        address: 'Kawasan Industri Jababeka Blok C-12',
      },
    });
    warehouseId = whEntity.id;

    const fee = await p09.prisma.sampleFee.create({
      data: {
        feeNumber: `SF-${Date.now()}`,
        customerId: lead.id,
        amount: 5000000,
        feeDate: new Date(),
      },
    });
    sampleFeeId = fee.id;
  }, 120000);

  afterAll(async () => {
    try {
      if (soId) {
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
        await p09.prisma.shipment.deleteMany({
          where: { soId },
        });
        await p09.prisma.invoice.deleteMany({
          where: { soId },
        });
        await p09.prisma.salesOrderItem.deleteMany({
          where: { soId },
        });
        await p09.prisma.salesOrder.deleteMany({
          where: { id: soId },
        });
      }
      await p09.prisma.sampleFee.deleteMany({
        where: { id: sampleFeeId },
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
    } catch (e) {
      console.error('P09 GT CLEANUP ERROR:', e);
    }
    await p09.app.close();
  });

  it('Step 1: Creates Sales Order totaling Rp 100,000,000 (Gatekeeper HELD, Status PENDING_DP)', async () => {
    const res = await request(p09.app.getHttpServer())
      .post('/commercial/sales-orders')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        leadId,
        sampleId,
        salesCategory: 'PRODUKSI',
        brandName: 'DermaGlow',
        items: [
          {
            materialId,
            productName: 'Acne Cream 20g',
            quantity: 2000,
            unitPrice: 50000,
            netto: 20,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.deliveryGateStatus).toBe('HELD');
    expect(res.body.status).toBe(SOStatus.PENDING_DP);
    expect(Number(res.body.totalAmount)).toBe(100000000);

    soId = res.body.id;
  });

  it('Step 2: Receives 50% Down Payment with sample fee offset and unlocks SO to ACTIVE', async () => {
    // 50% of 100M = 50M. Cash: 45M + Sample Fee Offset: 5M = 50M total DP
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

    dpInvoiceId = res.body.dpInvoiceId;
  });

  it('Step 3: Creates Final Invoice for remainder and releases Delivery Gatekeeper (BUS-RULE-006)', async () => {
    const res = await request(p09.app.getHttpServer())
      .post('/commercial/invoices')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        id: `INV-${Date.now()}-FINAL`,
        soId,
        type: InvoiceType.FINAL_PAYMENT,
        amountDue: 50000000,
        invoiceDate: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(Number(res.body.amountDue)).toBe(50000000);

    finalInvoiceId = res.body.id;

    // Release delivery gate via finance endpoint
    const relRes = await request(p09.app.getHttpServer())
      .post(`/commercial/invoices/${finalInvoiceId}/release-delivery`)
      .set('Authorization', `Bearer ${financeToken}`)
      .send({});

    expect(relRes.status).toBe(201);
    expect(relRes.body.deliveryGateStatus).toBe('RELEASED');

    // Verify SO deliveryGateStatus is now RELEASED
    const so = await p09.prisma.salesOrder.findUnique({ where: { id: soId } });
    expect(so?.deliveryGateStatus).toBe('RELEASED');
  });

  it('Step 4: Dispatches Delivery Order / Surat Jalan and updates SO to SHIPPED', async () => {
    const res = await request(p09.app.getHttpServer())
      .post('/fulfillment/shipments')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        soId,
        logisticsId: logisticsUserId,
        trackingNo: `EXP-${Date.now().toString().slice(-5)}`,
        notes: 'Dispatched to customer distribution center',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe(ShipStatus.SHIPPED);

    shipmentId = res.body.id;

    // Verify SO status is SHIPPED
    const so = await p09.prisma.salesOrder.findUnique({ where: { id: soId } });
    expect(so?.status).toBe(SOStatus.SHIPPED);
  });

  it('Step 5: Confirms Delivery and advances status to DELIVERED', async () => {
    const res = await request(p09.app.getHttpServer())
      .patch(`/fulfillment/shipments/${shipmentId}/status`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        status: ShipStatus.DELIVERED,
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(ShipStatus.DELIVERED);
    expect(res.body.deliveredAt).toBeDefined();
  });

  it('Step 6: Settles AR with PPh 23 deduction & processes overpayment (BUS-RULE-007, BUS-RULE-015)', async () => {
    // Outstanding: 50,000,000
    // Pay 51,000,000 + PPh 23 1,000,000 = 52,000,000 effective (2,000,000 overpayment)
    const res = await request(p09.app.getHttpServer())
      .post('/commercial/payments')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        invoiceId: finalInvoiceId,
        amountPaid: 51000000,
        pph23Deduction: 1000000,
      });

    expect(res.status).toBe(201);
    expect(res.body.effectivePaid).toBe(52000000);
    expect(res.body.arSettled).toBe(50000000);
    expect(res.body.overpayment).toBe(2000000);
    expect(res.body.outstandingAmount).toBe(0);
    expect(res.body.invoiceStatus).toBe(InvoiceStatus.PAID);
  });

  it('Step 7: Files Sales Return with Credit Note journal (BUS-RULE-012)', async () => {
    const res = await request(p09.app.getHttpServer())
      .post('/bussdev/returns')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        soId,
        warehouseId,
        notes: 'Damaged packaging returned for credit',
        returnStatus: 'POTONG_TAGIHAN',
        items: [
          {
            materialId,
            qtyReturned: 50,
            unitPrice: 50000,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.returnStatus).toBe('POTONG_TAGIHAN');

    // Verify Credit Note journal
    const cn = await p09.prisma.journalEntry.findFirst({
      where: { soId, sourceDocumentType: 'SALES_RETURN' },
    });
    expect(cn).toBeDefined();
    expect(cn?.reference).toMatch(/^CN-/);
  });
});
