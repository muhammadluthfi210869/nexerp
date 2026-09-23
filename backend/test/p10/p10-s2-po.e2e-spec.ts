import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP10App, P10App, p10Message } from './p10-http-harness';
import { UserRole, POStatus, PRStatus } from '@prisma/client';

describe('P10 - S2: Purchase Order (PO) Controls & Multi-Tier Approvals', () => {
  let p10: P10App;
  let adminToken: string;
  let purchasingToken: string;
  let directorToken: string;
  let tenantId: string;
  let supplierId: string;
  let materialId: string;
  let warehouseId: string;
  let approvedPrId: string;

  const testPrefix = `nex_p10_s2_${Date.now()}`;

  beforeAll(async () => {
    p10 = await bootP10App();
    tenantId = randomUUID();

    const admin = await p10.createUser(`${testPrefix}_admin`, [UserRole.SUPER_ADMIN], tenantId);
    const purch = await p10.createUser(`${testPrefix}_purch`, [UserRole.PURCHASING], tenantId);
    const director = await p10.createUser(`${testPrefix}_dir`, [UserRole.DIRECTOR], tenantId);

    adminToken = admin.token;
    purchasingToken = purch.token;
    directorToken = director.token;

    const wh = await p10.prisma.warehouse.create({
      data: {
        name: `${testPrefix}_Warehouse`,
        address: 'PO Test Warehouse',
      },
    });
    warehouseId = wh.id;

    const sup = await p10.prisma.supplier.create({
      data: {
        name: `${testPrefix}_Supplier`,
        phone: '08222222222',
        termOfPayment: 30,
      },
    });
    supplierId = sup.id;

    // Master material with unitPrice = 100,000
    const mat = await p10.prisma.materialItem.create({
      data: {
        name: `${testPrefix}_Material`,
        code: `MAT-${Date.now()}-PO`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 100000,
        stockQty: 50,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 20,
      },
    });
    materialId = mat.id;

    // Create an approved PR to test PR -> PO conversion
    const pr = await p10.prisma.purchaseRequest.create({
      data: {
        requestNumber: `PR-${Date.now().toString().slice(-6)}-1234`,
        warehouseId,
        supplierId,
        status: PRStatus.APPROVED,
        items: {
          create: [
            {
              materialId,
              qtyRequired: 20,
              estimatedPrice: 100000,
            },
          ],
        },
      },
    });
    approvedPrId = pr.id;
  });

  afterAll(async () => {
    try {
      await p10.prisma.purchaseOrderItem.deleteMany({
        where: { materialId },
      });
      await p10.prisma.purchaseOrder.deleteMany({
        where: { supplierId },
      });
      await p10.prisma.purchaseRequestItem.deleteMany({
        where: { materialId },
      });
      await p10.prisma.purchaseRequest.deleteMany({
        where: { id: approvedPrId },
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

  it('1. Enforces BUS-RULE-025: Rejects price exceeding 110% of master price without priceOverrideReason', async () => {
    // Master unitPrice is 100,000. 115,000 is 115% (>110%)
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/orders')
      .set('Authorization', `Bearer ${purchasingToken}`)
      .send({
        supplierId,
        items: [
          {
            materialId,
            quantity: 10,
            unitPrice: 115000, // > 110%
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(p10Message(res)).toContain('melebihi SOP 110%');
  });

  it('2. Accepts price exceeding 110% when priceOverrideReason is provided', async () => {
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/orders')
      .set('Authorization', `Bearer ${purchasingToken}`)
      .send({
        supplierId,
        items: [
          {
            materialId,
            quantity: 10,
            unitPrice: 115000,
          },
        ],
        priceOverrideReason: 'Sudden raw material supplier tariff increase Q3',
      });

    expect(res.status).toBe(201);
    expect(res.body.poNumber).toMatch(/^PO-\d+/);
    expect(res.body.status).toBe(POStatus.DRAFT);
    expect(res.body.priceOverrideReason).toBe('Sudden raw material supplier tariff increase Q3');
  });

  it('3. Converts PR to PO and auto-marks PR as CONVERTED', async () => {
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/orders')
      .set('Authorization', `Bearer ${purchasingToken}`)
      .send({
        supplierId,
        prId: approvedPrId,
        items: [
          {
            materialId,
            quantity: 20,
            unitPrice: 100000,
          },
        ],
        discount: 50000,
        taxPercent: 11,
      });

    expect(res.status).toBe(201);
    expect(res.body.prId).toBe(approvedPrId);

    // Verify PR status is CONVERTED
    const prCheck = await p10.prisma.purchaseRequest.findUnique({
      where: { id: approvedPrId },
    });
    expect(prCheck?.status).toBe(PRStatus.CONVERTED);
  });

  it('4. Enforces BUS-RULE-022: Requires signature for approval and validates multi-tier authority', async () => {
    // Create large PO > 100M (e.g. 200 items * 600,000 = 120M)
    const largePoRes = await request(p10.app.getHttpServer())
      .post('/purchase/orders')
      .set('Authorization', `Bearer ${purchasingToken}`)
      .send({
        supplierId,
        items: [
          {
            materialId,
            quantity: 1200,
            unitPrice: 100000, // 120M
          },
        ],
      });

    const largePoId = largePoRes.body.id;

    // Approve without signature -> 400
    const failSigRes = await request(p10.app.getHttpServer())
      .post(`/purchase/orders/${largePoId}/approve`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({});

    expect(failSigRes.status).toBe(400);
    expect(p10Message(failSigRes)).toContain('Tanda tangan digital wajib');

    // Purchasing staff trying to approve > 100M -> 403 (Requires DIRECTOR)
    const forbiddenRes = await request(p10.app.getHttpServer())
      .post(`/purchase/orders/${largePoId}/approve`)
      .set('Authorization', `Bearer ${purchasingToken}`)
      .send({ signatureUrl: 'data:image/png;base64,sample-signature' });

    expect(forbiddenRes.status).toBe(403);
    expect(p10Message(forbiddenRes)).toContain('memerlukan persetujuan Direktur');

    // Director approves with signature -> 201
    const successRes = await request(p10.app.getHttpServer())
      .post(`/purchase/orders/${largePoId}/approve`)
      .set('Authorization', `Bearer ${directorToken}`)
      .send({ signatureUrl: 'data:image/png;base64,director-signature-payload' });

    expect(successRes.status).toBe(201);
    expect(successRes.body.status).toBe(POStatus.APPROVED);
    expect(successRes.body.signatureUrl).toBe('data:image/png;base64,director-signature-payload');
  });
});
