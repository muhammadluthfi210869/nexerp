import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP10App, P10App, p10Message } from './p10-http-harness';
import { UserRole, PRStatus } from '@prisma/client';

describe('P10 - S1: Material Requirements Planning (MRP) & Purchase Request (PR)', () => {
  let p10: P10App;
  let adminToken: string;
  let purchasingToken: string;
  let tenantId: string;
  let warehouseId: string;
  let supplierId: string;
  let materialAId: string;
  let materialBId: string;

  const testPrefix = `nex_p10_s1_${Date.now()}`;

  beforeAll(async () => {
    p10 = await bootP10App();
    tenantId = randomUUID();

    const admin = await p10.createUser(`${testPrefix}_admin`, [UserRole.SUPER_ADMIN], tenantId);
    const purch = await p10.createUser(`${testPrefix}_purchasing`, [UserRole.PURCHASING], tenantId);

    adminToken = admin.token;
    purchasingToken = purch.token;

    // Prerequisite: Warehouse
    const wh = await p10.prisma.warehouse.create({
      data: {
        name: `${testPrefix}_Warehouse`,
        address: 'Test Warehouse Address',
      },
    });
    warehouseId = wh.id;

    // Prerequisite: Supplier
    const sup = await p10.prisma.supplier.create({
      data: {
        name: `${testPrefix}_Supplier`,
        phone: '08111111111',
      },
    });
    supplierId = sup.id;

    // Prerequisite: Materials
    const matA = await p10.prisma.materialItem.create({
      data: {
        name: `${testPrefix}_Material_A`,
        code: `MAT-${Date.now()}-A`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 50000,
        stockQty: 20,
        minLevel: 50,
        maxLevel: 1000,
        reorderPoint: 60,
      },
    });
    materialAId = matA.id;

    const matB = await p10.prisma.materialItem.create({
      data: {
        name: `${testPrefix}_Material_B`,
        code: `MAT-${Date.now()}-B`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 30000,
        stockQty: 100,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 20,
      },
    });
    materialBId = matB.id;
  });

  afterAll(async () => {
    // Cleanup
    try {
      await p10.prisma.purchaseRequestItem.deleteMany({
        where: { materialId: { in: [materialAId, materialBId] } },
      });
      await p10.prisma.purchaseRequest.deleteMany({
        where: { warehouseId },
      });
      await p10.prisma.materialItem.deleteMany({
        where: { id: { in: [materialAId, materialBId] } },
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

  it('1. Calculates MRP shortage correctly when requirement exceeds stock', async () => {
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/mrp/shortage')
      .set('Authorization', `Bearer ${purchasingToken}`)
      .send({
        items: [
          { materialId: materialAId, requiredQty: 50 }, // Stock is 20, shortage should be 30
          { materialId: materialBId, requiredQty: 60 }, // Stock is 100, shortage should be 0
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.hasShortage).toBe(true);
    expect(res.body.shortages).toHaveLength(1);
    expect(res.body.shortages[0].materialId).toBe(materialAId);
    expect(res.body.shortages[0].shortageQty).toBe(30);
    expect(res.body.shortages[0].suggestedPrQty).toBeGreaterThanOrEqual(30);
  });

  it('2. Creates PR successfully with valid data and items', async () => {
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/requests')
      .set('Authorization', `Bearer ${purchasingToken}`)
      .send({
        warehouseId,
        supplierId,
        priority: 'HIGH',
        urgency: 'HIGH',
        budgetCode: 'BDG-RAW-2026',
        notes: 'Urgent raw materials for upcoming batch',
        items: [
          {
            materialId: materialAId,
            quantity: 30,
            estimatedPrice: 50000,
            notes: 'Shortage coverage',
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.requestNumber).toMatch(/^PR-\d+/);
    expect(res.body.status).toBe(PRStatus.PENDING);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.budgetCode).toBe('BDG-RAW-2026');
  });

  it('3. Fails to create PR when no items are provided', async () => {
    const res = await request(p10.app.getHttpServer())
      .post('/purchase/requests')
      .set('Authorization', `Bearer ${purchasingToken}`)
      .send({
        warehouseId,
        supplierId,
        items: [],
      });

    expect(res.status).toBe(400);
  });

  it('4. Approves PR and transitions state to APPROVED', async () => {
    // Create PR first
    const createRes = await request(p10.app.getHttpServer())
      .post('/purchase/requests')
      .set('Authorization', `Bearer ${purchasingToken}`)
      .send({
        warehouseId,
        items: [
          {
            materialId: materialAId,
            quantity: 10,
            estimatedPrice: 50000,
          },
        ],
      });
    const prId = createRes.body.id;

    // Approve
    const approveRes = await request(p10.app.getHttpServer())
      .post(`/purchase/requests/${prId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(201);
    expect(approveRes.body.status).toBe(PRStatus.APPROVED);
  });

  it('5. Rejects PR and records rejection reason', async () => {
    const createRes = await request(p10.app.getHttpServer())
      .post('/purchase/requests')
      .set('Authorization', `Bearer ${purchasingToken}`)
      .send({
        warehouseId,
        items: [
          {
            materialId: materialAId,
            quantity: 5,
            estimatedPrice: 50000,
          },
        ],
      });
    const prId = createRes.body.id;

    const rejectRes = await request(p10.app.getHttpServer())
      .post(`/purchase/requests/${prId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Over budget limits' });

    expect(rejectRes.status).toBe(201);
    expect(rejectRes.body.status).toBe(PRStatus.REJECTED);
    expect(rejectRes.body.notes).toContain('Over budget limits');
  });

  it('6. Lists PRs with status and search filters', async () => {
    const listRes = await request(p10.app.getHttpServer())
      .get('/purchase/requests')
      .set('Authorization', `Bearer ${purchasingToken}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(2);
  });
});
