import request from 'supertest';
import { bootP11App, P11App, p11Message } from './p11-http-harness';
import { randomUUID } from 'crypto';

describe('P11-S3: Multi-Warehouse Access & Transfer Execution (AC-P11-03)', () => {
  let p11: P11App;
  let adminToken: string;
  let restrictedWhUser: { user: any; token: string };
  let sourceWarehouseId: string;
  let destWarehouseId: string;
  let materialId: string;
  let sourceBatchId: string;
  let supplierId: string;

  beforeAll(async () => {
    p11 = await bootP11App();

    const admin = await p11.createUser('ADMIN_S3', ['SUPER_ADMIN']);
    adminToken = admin.token;

    restrictedWhUser = await p11.createUser('WH_RESTRICTED_S3', ['WAREHOUSE']);

    const sup = await p11.prisma.supplier.create({
      data: { name: `nex_p11_sup_s3_${randomUUID().slice(0, 8)}` },
    });
    supplierId = sup.id;

    // Create 2 warehouses: Source and Destination
    const whSource = await p11.prisma.warehouse.create({
      data: {
        name: `nex_p11_wh_source_${randomUUID().slice(0, 8)}`,
        status: 'ACTIVE',
      },
    });
    sourceWarehouseId = whSource.id;

    const whDest = await p11.prisma.warehouse.create({
      data: {
        name: `nex_p11_wh_dest_${randomUUID().slice(0, 8)}`,
        status: 'ACTIVE',
      },
    });
    destWarehouseId = whDest.id;

    // Create test material
    const mat = await p11.prisma.materialItem.create({
      data: {
        name: `nex_p11_mat_trf_s3_${randomUUID().slice(0, 8)}`,
        code: `MAT-P11-TRF-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 75000,
        minLevel: 10,
        maxLevel: 500,
        reorderPoint: 20,
        stockQty: 100,
      },
    });
    materialId = mat.id;

    // Create batch in source warehouse
    const batch = await p11.prisma.materialInventory.create({
      data: {
        materialId,
        supplierId,
        batchNumber: `BATCH-P11-TRF-SRC-${randomUUID().slice(0, 4)}`,
        currentStock: 100,
        qcStatus: 'GOOD',
        expDate: new Date('2028-01-01T00:00:00.000Z'),
        receivingDate: new Date(),
      },
    });
    sourceBatchId = batch.id;
  });

  afterAll(async () => {
    await p11.prisma.transferOrderItem.deleteMany({
      where: { materialId },
    });
    await p11.prisma.transferOrder.deleteMany({
      where: {
        sourceWarehouseId: { in: [sourceWarehouseId, destWarehouseId] },
      },
    });
    await p11.prisma.inventoryTransaction.deleteMany({
      where: { materialId },
    });
    await p11.prisma.materialInventory.deleteMany({
      where: { materialId },
    });
    await p11.prisma.warehouseAccess.deleteMany({
      where: { userId: restrictedWhUser.user.id },
    });
    await p11.prisma.materialItem.deleteMany({
      where: { id: materialId },
    });
    await p11.prisma.warehouse.deleteMany({
      where: { id: { in: [sourceWarehouseId, destWarehouseId] } },
    });
    await p11.prisma.supplier.deleteMany({
      where: { id: supplierId },
    });
    await p11.app.close();
  });

  it('1. Rejects transfer creation when user has no access to source warehouse (BUS-RULE-051)', async () => {
    const res = await request(p11.app.getHttpServer())
      .post('/warehouse/transfers')
      .set('Authorization', `Bearer ${restrictedWhUser.token}`)
      .send({
        sourceWarehouseId,
        destWarehouseId,
        items: [{ materialId, qty: 20 }],
      });

    expect(res.status).toBe(403);
    const msg = p11Message(res);
    expect(msg).toContain('WAREHOUSE_ACCESS_DENIED');
  });

  it('2. Grants access via WarehouseAccess model and allows transfer creation', async () => {
    // Grant access to source warehouse
    await p11.prisma.warehouseAccess.create({
      data: {
        userId: restrictedWhUser.user.id,
        warehouseId: sourceWarehouseId,
        canRead: true,
        canWrite: true,
      },
    });

    const res = await request(p11.app.getHttpServer())
      .post('/warehouse/transfers')
      .set('Authorization', `Bearer ${restrictedWhUser.token}`)
      .send({
        sourceWarehouseId,
        destWarehouseId,
        items: [{ materialId, qty: 20 }],
        notes: 'Transfer 20kg to factory B',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.items).toHaveLength(1);
    expect(Number(res.body.items[0].qty)).toBe(20);
  });

  it('3. Rejects transfer execution if user lacks access to destination warehouse', async () => {
    // Create a pending transfer using admin
    const trf = await p11.prisma.transferOrder.create({
      data: {
        transferNumber: `TRF-P11-TEST-${randomUUID().slice(0, 6)}`,
        sourceWarehouseId,
        destWarehouseId,
        status: 'PENDING',
        items: {
          create: [{ materialId, qty: 15 }],
        },
      },
    });

    // Execute with restricted user who only has source access
    const res = await request(p11.app.getHttpServer())
      .post(`/warehouse/transfers/${trf.id}/execute`)
      .set('Authorization', `Bearer ${restrictedWhUser.token}`)
      .send({ userId: restrictedWhUser.user.id });

    expect(res.status).toBe(403);
    const msg = p11Message(res);
    expect(msg).toContain('WAREHOUSE_ACCESS_DENIED');
  });

  it('4. Admin / Authorized user executes transfer atomically updating source, destination, and ledger', async () => {
    const trf = await p11.prisma.transferOrder.create({
      data: {
        transferNumber: `TRF-P11-EXEC-${randomUUID().slice(0, 6)}`,
        sourceWarehouseId,
        destWarehouseId,
        status: 'PENDING',
        items: {
          create: [{ materialId, qty: 25 }],
        },
      },
    });

    const res = await request(p11.app.getHttpServer())
      .post(`/warehouse/transfers/${trf.id}/execute`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect([200, 201]).toContain(res.status);
    expect(res.body.status).toBe('COMPLETED');

    // Verify source batch deducted (100 - 25 = 75)
    const srcBatch = await p11.prisma.materialInventory.findUnique({
      where: { id: sourceBatchId },
    });
    expect(Number(srcBatch!.currentStock)).toBe(75);

    // Verify destination batch created with stock 25
    const destBatches = await p11.prisma.materialInventory.findMany({
      where: {
        materialId,
        notes: { contains: `Transferred from ${sourceWarehouseId}` },
      },
    });
    expect(destBatches.length).toBeGreaterThanOrEqual(1);
    expect(Number(destBatches[0].currentStock)).toBe(25);

    // Verify two ledger entries: TRANSFER_OUT and TRANSFER_IN
    const outTx = await p11.prisma.inventoryTransaction.findFirst({
      where: {
        referenceNo: trf.transferNumber,
        warehouseId: sourceWarehouseId,
      },
    });
    expect(outTx).toBeDefined();
    expect(Number(outTx!.quantity)).toBe(25);

    const inTx = await p11.prisma.inventoryTransaction.findFirst({
      where: {
        referenceNo: trf.transferNumber,
        warehouseId: destWarehouseId,
      },
    });
    expect(inTx).toBeDefined();
    expect(Number(inTx!.quantity)).toBe(25);
  });
});
