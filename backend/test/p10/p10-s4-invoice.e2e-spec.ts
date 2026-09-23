import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP10App, P10App, p10Message } from './p10-http-harness';
import { UserRole, POStatus, InboundStatus, PaymentStatus } from '@prisma/client';

describe('P10 - S4: Purchase Invoice & 4-Leg Zero-Tolerance Matching', () => {
  let p10: P10App;
  let adminToken: string;
  let financeToken: string;
  let tenantId: string;
  let supplierId: string;
  let warehouseId: string;
  let materialId: string;
  let poId: string;
  let grId: string;
  let dpId: string;

  const testPrefix = `nex_p10_s4_${Date.now()}`;

  beforeAll(async () => {
    p10 = await bootP10App();
    tenantId = randomUUID();

    const admin = await p10.createUser(`${testPrefix}_admin`, [UserRole.SUPER_ADMIN], tenantId);
    const fin = await p10.createUser(`${testPrefix}_fin`, [UserRole.FINANCE], tenantId);

    adminToken = admin.token;
    financeToken = fin.token;

    const wh = await p10.prisma.warehouse.create({
      data: {
        name: `${testPrefix}_Warehouse`,
        address: 'Invoice Test Warehouse',
      },
    });
    warehouseId = wh.id;

    const sup = await p10.prisma.supplier.create({
      data: {
        name: `${testPrefix}_Supplier`,
        phone: '08444444444',
      },
    });
    supplierId = sup.id;

    const mat = await p10.prisma.materialItem.create({
      data: {
        name: `${testPrefix}_Material_Inv`,
        code: `MAT-${Date.now()}-INV`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 50000,
        stockQty: 0,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 20,
      },
    });
    materialId = mat.id;

    // 1. PO: 100 units @ 50,000 = 5,000,000
    const po = await p10.prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-${Date.now().toString().slice(-6)}-4444`,
        supplierId,
        status: POStatus.APPROVED,
        items: {
          create: [
            {
              materialId,
              quantity: 100,
              unitPrice: 50000,
              totalPrice: 5000000,
            },
          ],
        },
      },
    });
    poId = po.id;

    // 2. GR: 80 Good received, 20 Reject
    const inbound = await p10.prisma.warehouseInbound.create({
      data: {
        inboundNumber: `INB-${Date.now().toString().slice(-6)}-4444`,
        poId,
        warehouseId,
        status: InboundStatus.APPROVED,
        items: {
          create: [
            {
              materialId,
              qtyActual: 100,
              qtyGood: 80,
              qtyReject: 20,
              qtyFree: 0,
            },
          ],
        },
      },
    });
    grId = inbound.id;

    // 3. Down Payment: 1,000,000 paid to supplier
    const dp = await p10.prisma.downPayment.create({
      data: {
        dpNumber: `DPB-${Date.now().toString().slice(-6)}-001`,
        vendorId: supplierId,
        amount: 1000000,
        remainingAmount: 1000000,
        status: PaymentStatus.PAID,
        date: new Date(),
      },
    });
    dpId = dp.id;
  });

  afterAll(async () => {
    try {
      await p10.prisma.billAllocation.deleteMany({
        where: { bill: { vendorId: supplierId } },
      });
      await p10.prisma.billMatchResult.deleteMany({
        where: { bill: { vendorId: supplierId } },
      });
      await p10.prisma.billLineItem.deleteMany({
        where: { bill: { vendorId: supplierId } },
      });
      await p10.prisma.bill.deleteMany({
        where: { vendorId: supplierId },
      });
      await p10.prisma.downPayment.deleteMany({
        where: { id: dpId },
      });
      await p10.prisma.inboundItem.deleteMany({
        where: { materialId },
      });
      await p10.prisma.warehouseInbound.deleteMany({
        where: { id: grId },
      });
      await p10.prisma.purchaseOrderItem.deleteMany({
        where: { materialId },
      });
      await p10.prisma.purchaseOrder.deleteMany({
        where: { id: poId },
      });
      await p10.prisma.materialItem.deleteMany({
        where: { id: materialId },
      });
      await p10.prisma.warehouse.deleteMany({
        where: { id: warehouseId },
      });
      await p10.prisma.supplier.deleteMany({
        where: { id: supplierId },
      });
      await p10.prisma.user.deleteMany({
        where: { email: { contains: testPrefix } },
      });
    } catch {}
    await p10.app.close();
  });

  it('1. Enforces BUS-RULE-003: Rejects future invoice date', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/invoices')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        poId,
        grId,
        invoiceNumber: 'INV-FUT-001',
        invoiceDate: tomorrow,
        vendorId: supplierId,
        items: [{ materialId, quantity: 80, unitPrice: 50000 }],
      });

    expect(res.status).toBe(400);
    expect(p10Message(res)).toContain('tidak boleh lebih dari hari ini');
  });

  it('2. Enforces BUS-RULE-023: Zero-tolerance match blocks invoice when billed price exceeds PO price', async () => {
    // PO price is 50,000. Invoicing at 55,000
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/invoices')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        poId,
        grId,
        invoiceNumber: 'INV-MISMATCH-PRICE',
        invoiceDate: new Date().toISOString(),
        vendorId: supplierId,
        items: [{ materialId, quantity: 80, unitPrice: 55000 }],
      });

    expect(res.status).toBe(400);
    expect(p10Message(res)).toContain('Mismatch Harga');
  });

  it('3. Enforces BUS-RULE-023: Zero-tolerance match blocks invoice when billed qty exceeds GR qty', async () => {
    // GR Good received is 80. Invoicing 90
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/invoices')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        poId,
        grId,
        invoiceNumber: 'INV-MISMATCH-QTY',
        invoiceDate: new Date().toISOString(),
        vendorId: supplierId,
        items: [{ materialId, quantity: 90, unitPrice: 50000 }],
      });

    expect(res.status).toBe(400);
    expect(p10Message(res)).toContain('Mismatch Kuantitas');
  });

  it('4. Creates matched invoice with DP offset (BUS-RULE-024) and verifies remaining DP update', async () => {
    // Subtotal: 80 * 50,000 = 4,000,000
    // DP offset: 1,000,000
    // Expected grand total: 3,000,000
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/invoices')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        poId,
        grId,
        invoiceNumber: 'INV-MATCHED-001',
        invoiceDate: new Date().toISOString(),
        vendorId: supplierId,
        downPaymentId: dpId,
        downPaymentDeduction: 1000000,
        items: [{ materialId, quantity: 80, unitPrice: 50000 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.billNumber).toMatch(/^FP-\d+/);
    expect(Number(res.body.subtotal)).toBe(4000000);
    expect(Number(res.body.downPaymentDeduction)).toBe(1000000);
    expect(Number(res.body.grandTotal)).toBe(3000000);
    expect(res.body.matchResult.isMatched).toBe(true);

    // Verify down payment remaining amount became 0
    const updatedDp = await p10.prisma.downPayment.findUnique({
      where: { id: dpId },
    });
    expect(Number(updatedDp?.remainingAmount)).toBe(0);
  });

  it('5. Prevents duplicate vendor invoice number', async () => {
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/invoices')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        poId,
        grId,
        invoiceNumber: 'INV-MATCHED-001', // duplicate for same supplier
        invoiceDate: new Date().toISOString(),
        vendorId: supplierId,
        items: [{ materialId, quantity: 80, unitPrice: 50000 }],
      });

    expect(res.status).toBe(400);
    expect(p10Message(res)).toContain('sudah pernah dicatat');
  });
});
