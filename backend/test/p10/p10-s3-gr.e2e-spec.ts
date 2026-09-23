import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP10App, P10App, p10Message } from './p10-http-harness';
import { UserRole, POStatus, InboundStatus } from '@prisma/client';

describe('P10 - S3: Goods Receipt (GR) 3-Pillar & Stock Increment', () => {
  let p10: P10App;
  let adminToken: string;
  let warehouseToken: string;
  let tenantId: string;
  let warehouseId: string;
  let supplierId: string;
  let materialId: string;
  let poId: string;

  const testPrefix = `nex_p10_s3_${Date.now()}`;

  beforeAll(async () => {
    p10 = await bootP10App();
    tenantId = randomUUID();

    const admin = await p10.createUser(`${testPrefix}_admin`, [UserRole.SUPER_ADMIN], tenantId);
    const whUser = await p10.createUser(`${testPrefix}_wh`, [UserRole.WAREHOUSE], tenantId);

    adminToken = admin.token;
    warehouseToken = whUser.token;

    const wh = await p10.prisma.warehouse.create({
      data: {
        name: `${testPrefix}_Warehouse`,
        address: 'GR Test Warehouse',
      },
    });
    warehouseId = wh.id;

    const sup = await p10.prisma.supplier.create({
      data: {
        name: `${testPrefix}_Supplier`,
        phone: '08333333333',
      },
    });
    supplierId = sup.id;

    const mat = await p10.prisma.materialItem.create({
      data: {
        name: `${testPrefix}_Material_GR`,
        code: `MAT-${Date.now()}-GR`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 25000,
        stockQty: 100, // Initial stock: 100
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 20,
      },
    });
    materialId = mat.id;

    // Create an Approved PO with 50 units
    const po = await p10.prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-${Date.now().toString().slice(-6)}-9999`,
        supplierId,
        status: POStatus.APPROVED,
        items: {
          create: [
            {
              materialId,
              quantity: 50,
              unitPrice: 25000,
              totalPrice: 1250000,
            },
          ],
        },
      },
    });
    poId = po.id;
  });

  afterAll(async () => {
    try {
      await p10.prisma.inboundItem.deleteMany({
        where: { materialId },
      });
      await p10.prisma.warehouseInbound.deleteMany({
        where: { poId },
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

  it('1. Enforces BUS-RULE-018: Rejects receipt when qtyGood + qtyReject + qtyFree does not match PO quantity', async () => {
    // PO qty is 50. Sending 40 + 5 + 0 = 45 != 50
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/goods-receipts')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        poId,
        warehouseId,
        doNumber: 'DO-SUPP-12345',
        driverName: 'Budi Santoso',
        vehiclePlate: 'B 1234 XYZ',
        items: [
          {
            materialId,
            quantity: 45, // Mismatch
            qtyGood: 40,
            qtyReject: 5,
            qtyFree: 0,
            notes: 'Short shipment',
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(p10Message(res)).toContain('tidak sama dengan qty PO');
  });

  it('2. Accepts 3-pillar receipt when qtyGood + qtyReject + qtyFree equals PO quantity', async () => {
    // 50 = 42 Good + 5 Reject + 3 Free
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/goods-receipts')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        poId,
        warehouseId,
        doNumber: 'DO-SUPP-12345',
        driverName: 'Budi Santoso',
        vehiclePlate: 'B 1234 XYZ',
        items: [
          {
            materialId,
            quantity: 50,
            qtyGood: 42,
            qtyReject: 5,
            qtyFree: 3,
            notes: 'Batch inspected',
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.inboundNumber).toMatch(/^GRN-\d+/);
    expect(Number(res.body.items[0].qtyGood)).toBe(42);
    expect(Number(res.body.items[0].qtyReject)).toBe(5);
    expect(Number(res.body.items[0].qtyFree)).toBe(3);
  });

  it('3. Increases stock ONLY by qtyGood (+42) upon posting, ignoring qtyReject', async () => {
    // Check initial stock
    const matBefore = await p10.prisma.materialItem.findUnique({
      where: { id: materialId },
    });
    const initialStock = Number(matBefore?.stockQty);

    // Get the created inbound
    const inbound = await p10.prisma.warehouseInbound.findFirst({
      where: { poId },
      include: { items: true },
    });

    // Post / Approve the Goods Receipt
    const postRes = await request(p10.app.getHttpServer())
      .post(`/purchase/goods-receipts/${inbound?.id}/post`)
      .set('Authorization', `Bearer ${warehouseToken}`);

    expect(postRes.status).toBe(201);
    expect(postRes.body.status).toBe(InboundStatus.APPROVED);

    // Verify stock is now initialStock + 42
    const matAfter = await p10.prisma.materialItem.findUnique({
      where: { id: materialId },
    });
    expect(Number(matAfter?.stockQty)).toBe(initialStock + 42);

    // Verify PO status is updated to CLOSED (all 50 accounted for)
    const poAfter = await p10.prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });
    expect(poAfter?.status).toBe(POStatus.CLOSED);
  });
});
