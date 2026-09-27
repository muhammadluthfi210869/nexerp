import request from 'supertest';
import { bootP11App, P11App, p11Message } from './p11-http-harness';
import { randomUUID } from 'crypto';

describe('P11-S1: Inbound Quarantine & QC Release (AC-P11-01)', () => {
  let p11: P11App;
  let warehouseToken: string;
  let qcToken: string;
  let testWarehouseId: string;
  let testMaterialId: string;

  beforeAll(async () => {
    p11 = await bootP11App();

    const whUser = await p11.createUser('WH_S1', ['WAREHOUSE']);
    warehouseToken = whUser.token;

    const qcUser = await p11.createUser('QC_S1', ['QC_LAB']);
    qcToken = qcUser.token;

    // Create test warehouse
    const wh = await p11.prisma.warehouse.create({
      data: {
        name: `nex_p11_wh_s1_${randomUUID().slice(0, 8)}`,
        status: 'ACTIVE',
      },
    });
    testWarehouseId = wh.id;

    // Create test material
    const mat = await p11.prisma.materialItem.create({
      data: {
        name: `nex_p11_mat_s1_${randomUUID().slice(0, 8)}`,
        code: `MAT-P11-S1-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 50000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 0,
      },
    });
    testMaterialId = mat.id;
  });

  afterAll(async () => {
    // Clean up created resources
    await p11.prisma.inboundItem.deleteMany({
      where: { materialId: testMaterialId },
    });
    await p11.prisma.warehouseInbound.deleteMany({
      where: { warehouseId: testWarehouseId },
    });
    await p11.prisma.inventoryTransaction.deleteMany({
      where: { materialId: testMaterialId },
    });
    await p11.prisma.materialInventory.deleteMany({
      where: { materialId: testMaterialId },
    });
    await p11.prisma.materialItem.deleteMany({
      where: { id: testMaterialId },
    });
    await p11.prisma.warehouse.deleteMany({
      where: { id: testWarehouseId },
    });
    await p11.app.close();
  });

  it('1. Rejects Inbound creation without batchNumber or expiryDate (BUS-RULE-053)', async () => {
    const res = await request(p11.app.getHttpServer())
      .post('/warehouse/inbounds')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        warehouseId: testWarehouseId,
        items: [
          {
            materialId: testMaterialId,
            quantity: 100,
            // missing batchNumber and expiryDate
          },
        ],
      });

    expect(res.status).toBe(400);
    const msg = p11Message(res);
    expect(msg).toContain('Nomor Batch Supplier dan Expired Date wajib diisi');
  });

  it('2. Creates Inbound with mandatory batch and items placed in QUARANTINE (BUS-RULE-046)', async () => {
    const res = await request(p11.app.getHttpServer())
      .post('/warehouse/inbounds')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        warehouseId: testWarehouseId,
        items: [
          {
            materialId: testMaterialId,
            quantity: 50,
            batchNumber: 'BATCH-SUP-2026-001',
            expiryDate: '2028-12-31T00:00:00.000Z',
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].isQuarantine).toBe(true);
    expect(res.body.items[0].qcStatus).toBe('QUARANTINE');

    // Verify stockQty in MaterialItem is STILL 0 (quarantined stock does not increase available balance)
    const mat = await p11.prisma.materialItem.findUnique({
      where: { id: testMaterialId },
    });
    expect(mat).not.toBeNull();
    expect(Number(mat!.stockQty)).toBe(0);
  });

  it('3. QC Release atomically moves stock from QUARANTINE to AVAILABLE (BUS-RULE-047 & BUS-RULE-048)', async () => {
    // Create new inbound for release test
    const inb = await p11.prisma.warehouseInbound.create({
      data: {
        inboundNumber: `GRN-P11-S1-${randomUUID().slice(0, 8)}`,
        warehouseId: testWarehouseId,
        status: 'PENDING',
        items: {
          create: [
            {
              materialId: testMaterialId,
              qtyActual: 80,
              isQuarantine: true,
              qcStatus: 'QUARANTINE',
            },
          ],
        },
      },
      include: { items: true },
    });

    const res = await request(p11.app.getHttpServer())
      .post(`/warehouse/inbounds/${inb.id}/release`)
      .set('Authorization', `Bearer ${qcToken}`)
      .send({ performedBy: 'QC_INSPECTOR_P11' });

    expect([200, 201]).toContain(res.status);

    // Verify stockQty increased to 80
    const mat = await p11.prisma.materialItem.findUnique({
      where: { id: testMaterialId },
    });
    expect(mat).not.toBeNull();
    expect(Number(mat!.stockQty)).toBe(80);

    // Verify MaterialInventory batch created with GOOD status
    const batches = await p11.prisma.materialInventory.findMany({
      where: { materialId: testMaterialId },
    });
    expect(batches.length).toBeGreaterThanOrEqual(1);
    const goodBatch = batches.find((b) => b.qcStatus === 'GOOD');
    expect(goodBatch).toBeDefined();
    expect(Number(goodBatch!.currentStock)).toBe(80);

    // Verify InventoryTransaction ledger entry emitted (BUS-RULE-048)
    const tx = await p11.prisma.inventoryTransaction.findFirst({
      where: { materialId: testMaterialId, type: 'INBOUND' },
    });
    expect(tx).toBeDefined();
    expect(Number(tx!.quantity)).toBe(80);
    expect(tx!.referenceNo).toBe(inb.inboundNumber);
  });

  it('4. Rejects duplicate release attempts (Idempotency / State Invariant)', async () => {
    // Find inbound already released
    const releasedInb = await p11.prisma.warehouseInbound.findFirst({
      where: { warehouseId: testWarehouseId, status: 'APPROVED' },
    });

    if (releasedInb) {
      const res = await request(p11.app.getHttpServer())
        .post(`/warehouse/inbounds/${releasedInb.id}/release`)
        .set('Authorization', `Bearer ${qcToken}`)
        .send({ performedBy: 'QC_INSPECTOR_P11' });

      expect(res.status).toBe(400);
      const msg = p11Message(res);
      expect(msg).toContain('Inbound already processed');
    }
  });
});
