import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP10App, P10App, p10Message } from './p10-http-harness';
import {
  UserRole,
  PRStatus,
  POStatus,
  InboundStatus,
  PurchaseReturnStatus,
  PaymentStatus,
} from '@prisma/client';

describe('P10 - Golden Thread: End-to-End Procurement Lifecycle', () => {
  let p10: P10App;
  let adminToken: string;
  let purchasingToken: string;
  let warehouseToken: string;
  let financeToken: string;
  let directorToken: string;

  let tenantId: string;
  let warehouseId: string;
  let supplierId: string;
  let materialId: string;

  const testPrefix = `nex_p10_gt_${Date.now()}`;

  beforeAll(async () => {
    p10 = await bootP10App();
    tenantId = randomUUID();

    const admin = await p10.createUser(`${testPrefix}_admin`, [UserRole.SUPER_ADMIN], tenantId);
    const purch = await p10.createUser(`${testPrefix}_purch`, [UserRole.PURCHASING], tenantId);
    const wh = await p10.createUser(`${testPrefix}_wh`, [UserRole.WAREHOUSE], tenantId);
    const fin = await p10.createUser(`${testPrefix}_fin`, [UserRole.FINANCE], tenantId);
    const dir = await p10.createUser(`${testPrefix}_dir`, [UserRole.DIRECTOR], tenantId);

    adminToken = admin.token;
    purchasingToken = purch.token;
    warehouseToken = wh.token;
    financeToken = fin.token;
    directorToken = dir.token;

    // Prerequisite: Warehouse
    const whEntity = await p10.prisma.warehouse.create({
      data: {
        name: `${testPrefix}_Central_Warehouse`,
      },
    });
    warehouseId = whEntity.id;

    // Prerequisite: Supplier
    const supEntity = await p10.prisma.supplier.create({
      data: {
        name: `${testPrefix}_Chemical_Indo`,
        phone: '081299998888',
        termOfPayment: 30,
      },
    });
    supplierId = supEntity.id;

    // Prerequisite: Raw Material (Stock: 10, Min: 50, Unit Price: 100,000)
    const mat = await p10.prisma.materialItem.create({
      data: {
        name: `${testPrefix}_Active_Ingredient_X`,
        code: `MAT-${Date.now()}-GT`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 100000,
        stockQty: 10,
        minLevel: 50,
        maxLevel: 1000,
        reorderPoint: 60,
      },
    });
    materialId = mat.id;
  });

  afterAll(async () => {
    try {
      await p10.prisma.purchaseReturnItem.deleteMany({ where: { materialId } });
      await p10.prisma.purchaseReturn.deleteMany({ where: { supplierId } });
      await p10.prisma.billAllocation.deleteMany({ where: { bill: { vendorId: supplierId } } });
      await p10.prisma.aPPayment.deleteMany({ where: { vendorId: supplierId } });
      await p10.prisma.billMatchResult.deleteMany({ where: { bill: { vendorId: supplierId } } });
      await p10.prisma.billLineItem.deleteMany({ where: { bill: { vendorId: supplierId } } });
      await p10.prisma.bill.deleteMany({ where: { vendorId: supplierId } });
      await p10.prisma.downPayment.deleteMany({ where: { vendorId: supplierId } });
      await p10.prisma.inboundItem.deleteMany({ where: { materialId } });
      await p10.prisma.warehouseInbound.deleteMany({ where: { warehouseId } });
      await p10.prisma.purchaseOrderItem.deleteMany({ where: { materialId } });
      await p10.prisma.purchaseOrder.deleteMany({ where: { supplierId } });
      await p10.prisma.purchaseRequestItem.deleteMany({ where: { materialId } });
      await p10.prisma.purchaseRequest.deleteMany({ where: { warehouseId } });
      await p10.prisma.materialItem.deleteMany({ where: { id: materialId } });
      await p10.prisma.warehouse.deleteMany({ where: { id: warehouseId } });
      await p10.prisma.supplier.deleteMany({ where: { id: supplierId } });
      await p10.prisma.user.deleteMany({ where: { email: { contains: testPrefix } } });
    } catch {}
    await p10.app.close();
  });

  it('Golden Thread Flow: MRP -> PR -> PO -> GR -> Invoice (4-Leg) -> AP Payment -> Return & DN', async () => {
    // -------------------------------------------------------------
    // Step 1: MRP Shortage Calculation
    // -------------------------------------------------------------
    const mrpRes = await request(p10.app.getHttpServer())
      .post('/purchase/mrp/shortage')
      .set('Authorization', `Bearer ${purchasingToken}`)
      .send({
        items: [{ materialId, requiredQty: 100 }], // Needs 100, Stock is 10 -> Shortage 90
      });

    expect(mrpRes.status).toBe(201);
    expect(mrpRes.body.hasShortage).toBe(true);
    expect(mrpRes.body.shortages[0].shortageQty).toBe(90);

    // -------------------------------------------------------------
    // Step 2: Create Purchase Request (PR) for 100 units
    // -------------------------------------------------------------
    const prRes = await request(p10.app.getHttpServer())
      .post('/purchase/requests')
      .set('Authorization', `Bearer ${purchasingToken}`)
      .send({
        warehouseId,
        supplierId,
        priority: 'HIGH',
        budgetCode: 'BDG-RAW-GT',
        items: [
          {
            materialId,
            quantity: 100,
            estimatedPrice: 100000,
          },
        ],
      });

    expect(prRes.status).toBe(201);
    const prId = prRes.body.id;
    expect(prRes.body.status).toBe(PRStatus.PENDING);

    // Step 2b: Approve PR
    const prApproveRes = await request(p10.app.getHttpServer())
      .post(`/purchase/requests/${prId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(prApproveRes.status).toBe(201);
    expect(prApproveRes.body.status).toBe(PRStatus.APPROVED);

    // -------------------------------------------------------------
    // Step 3: Convert PR to Purchase Order (PO)
    // -------------------------------------------------------------
    const poRes = await request(p10.app.getHttpServer())
      .post('/purchase/orders')
      .set('Authorization', `Bearer ${purchasingToken}`)
      .send({
        supplierId,
        prId,
        items: [
          {
            materialId,
            quantity: 100,
            unitPrice: 100000, // 10,000,000
          },
        ],
        taxPercent: 11, // Subtotal 10M, Tax 1.1M, Total 11.1M
      });

    expect(poRes.status).toBe(201);
    const poId = poRes.body.id;
    expect(poRes.body.status).toBe(POStatus.DRAFT);

    // Verify PR is marked CONVERTED
    const prCheck = await p10.prisma.purchaseRequest.findUnique({ where: { id: prId } });
    expect(prCheck?.status).toBe(PRStatus.CONVERTED);

    // Step 3b: Approve PO with Director Signature
    const poApproveRes = await request(p10.app.getHttpServer())
      .post(`/purchase/orders/${poId}/approve`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({
        signatureUrl: 'data:image/png;base64,golden-thread-director-signature',
      });

    expect(poApproveRes.status).toBe(201);
    expect(poApproveRes.body.status).toBe(POStatus.APPROVED);

    // -------------------------------------------------------------
    // Step 4: Goods Receipt (GR) 3-Pillar (90 Good, 5 Reject, 5 Free)
    // -------------------------------------------------------------
    const grRes = await request(p10.app.getHttpServer())
      .post('/purchase/goods-receipts')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        poId,
        warehouseId,
        doNumber: 'DO-VENDOR-GT-001',
        driverName: 'Ahmad Supir',
        vehiclePlate: 'B 9999 XYZ',
        items: [
          {
            materialId,
            quantity: 100,
            qtyGood: 90,
            qtyReject: 5,
            qtyFree: 5,
          },
        ],
      });

    expect(grRes.status).toBe(201);
    const grId = grRes.body.id;

    // Step 4b: Post Goods Receipt -> updates stock
    const postGrRes = await request(p10.app.getHttpServer())
      .post(`/purchase/goods-receipts/${grId}/post`)
      .set('Authorization', `Bearer ${warehouseToken}`);

    expect(postGrRes.status).toBe(201);
    expect(postGrRes.body.status).toBe(InboundStatus.APPROVED);

    // Real stock should increase by qtyGood (10 initial + 90 = 100)
    const stockCheck = await p10.prisma.materialItem.findUnique({ where: { id: materialId } });
    expect(Number(stockCheck?.stockQty)).toBe(100);

    // -------------------------------------------------------------
    // Step 5: Vendor Down Payment (DP)
    // -------------------------------------------------------------
    const dpRes = await request(p10.app.getHttpServer())
      .post('/purchase/down-payments')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        vendorId: supplierId,
        amount: 2000000, // 2M DP
        notes: 'DP 20% for GT PO',
      });

    expect(dpRes.status).toBe(201);
    const dpId = dpRes.body.id;

    // -------------------------------------------------------------
    // Step 6: Purchase Invoice with 4-Leg Match & DP Offset
    // Billed qty: 90 units (qtyGood received), unitPrice: 100,000
    // Subtotal: 9,000,000. DP deduction: 2,000,000. Grand Total: 7,000,000
    // -------------------------------------------------------------
    const invRes = await request(p10.app.getHttpServer())
      .post('/purchase/invoices')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        poId,
        grId,
        vendorId: supplierId,
        invoiceNumber: 'INV-GT-FINAL-001',
        invoiceDate: new Date().toISOString(),
        downPaymentId: dpId,
        downPaymentDeduction: 2000000,
        items: [
          {
            materialId,
            quantity: 90,
            unitPrice: 100000,
          },
        ],
      });

    expect(invRes.status).toBe(201);
    const billId = invRes.body.id;
    expect(Number(invRes.body.subtotal)).toBe(9000000);
    expect(Number(invRes.body.grandTotal)).toBe(7000000);
    expect(invRes.body.matchResult.isMatched).toBe(true);

    // -------------------------------------------------------------
    // Step 7: AP Payment of remaining balance (7,000,000)
    // -------------------------------------------------------------
    const payRes = await request(p10.app.getHttpServer())
      .post('/purchase/payments')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        vendorId: supplierId,
        billId,
        amount: 7000000,
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'TRF-FINAL-SETTLEMENT',
      });

    expect(payRes.status).toBe(201);

    // Verify Bill is now fully PAID
    const billCheck = await p10.prisma.bill.findUnique({ where: { id: billId } });
    expect(billCheck?.paymentStatus).toBe(PaymentStatus.PAID);
    expect(Number(billCheck?.paidAmount)).toBe(7000000);

    // -------------------------------------------------------------
    // Step 8: Purchase Return for Defective Goods & Debit Note
    // Return 5 units from stock
    // -------------------------------------------------------------
    const retRes = await request(p10.app.getHttpServer())
      .post('/purchase/returns')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        supplierId,
        reason: 'Contaminated raw material units detected later in production testing',
        items: [
          {
            materialId,
            quantity: 5,
            unitPrice: 100000,
            reason: 'Quality defect',
          },
        ],
      });

    expect(retRes.status).toBe(201);
    const returnId = retRes.body.id;

    // Approve Return -> generates Debit Note
    const retApproveRes = await request(p10.app.getHttpServer())
      .post(`/purchase/returns/${returnId}/approve`)
      .set('Authorization', `Bearer ${financeToken}`);

    expect(retApproveRes.status).toBe(201);
    expect(retApproveRes.body.status).toBe(PurchaseReturnStatus.COMPLETED);
    expect(retApproveRes.body.debitNoteNumber).toMatch(/^DN-\d+/);
    expect(Number(retApproveRes.body.debitNoteAmount)).toBe(500000);

    // Stock decreases by 5 (100 -> 95)
    const finalStock = await p10.prisma.materialItem.findUnique({ where: { id: materialId } });
    expect(Number(finalStock?.stockQty)).toBe(95);

    // Verify Audit Logs have been captured for operations
    const auditLogs = await p10.prisma.auditLog.findMany({
      where: { source: 'SCM_PROCUREMENT' },
      take: 5,
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(3);
  });
});
