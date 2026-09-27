import request from 'supertest';
import { bootP11App, P11App, p11Message } from './p11-http-harness';
import { randomUUID } from 'crypto';

describe('P11-S2: FEFO/FIFO Pick Enforcement & No-Negative-Stock (AC-P11-02)', () => {
  let p11: P11App;
  let warehouseToken: string;
  let rawMaterialId: string;
  let packagingMaterialId: string;
  let batchEarlyRawId: string;
  let batchLateRawId: string;
  let batchEarlyPkgId: string;
  let batchLatePkgId: string;
  let supplierId: string;

  beforeAll(async () => {
    p11 = await bootP11App();

    const whUser = await p11.createUser('WH_S2', ['WAREHOUSE']);
    warehouseToken = whUser.token;

    const sup = await p11.prisma.supplier.create({
      data: {
        name: `nex_p11_sup_s2_${randomUUID().slice(0, 8)}`,
      },
    });
    supplierId = sup.id;

    // Create Raw Material
    const raw = await p11.prisma.materialItem.create({
      data: {
        name: `nex_p11_mat_raw_s2_${randomUUID().slice(0, 8)}`,
        code: `MAT-P11-RAW-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 100000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 100,
      },
    });
    rawMaterialId = raw.id;

    // Create Packaging Material
    const pkg = await p11.prisma.materialItem.create({
      data: {
        name: `nex_p11_mat_pkg_s2_${randomUUID().slice(0, 8)}`,
        code: `MAT-P11-PKG-${randomUUID().slice(0, 6)}`,
        type: 'PACKAGING',
        unit: 'PCS',
        unitPrice: 2000,
        minLevel: 50,
        maxLevel: 5000,
        reorderPoint: 100,
        stockQty: 500,
      },
    });
    packagingMaterialId = pkg.id;

    // Create 2 batches for raw material (Batch Early: Exp 2027, Batch Late: Exp 2028)
    const bEarlyRaw = await p11.prisma.materialInventory.create({
      data: {
        materialId: rawMaterialId,
        supplierId,
        batchNumber: `BATCH-P11-RAW-EARLY-${randomUUID().slice(0, 4)}`,
        currentStock: 40,
        qcStatus: 'GOOD',
        expDate: new Date('2027-01-01T00:00:00.000Z'),
        receivingDate: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    batchEarlyRawId = bEarlyRaw.id;

    const bLateRaw = await p11.prisma.materialInventory.create({
      data: {
        materialId: rawMaterialId,
        supplierId,
        batchNumber: `BATCH-P11-RAW-LATE-${randomUUID().slice(0, 4)}`,
        currentStock: 60,
        qcStatus: 'GOOD',
        expDate: new Date('2028-06-01T00:00:00.000Z'),
        receivingDate: new Date('2026-02-01T00:00:00.000Z'),
      },
    });
    batchLateRawId = bLateRaw.id;

    // Create 2 batches for packaging (Batch Early: Received 10 days ago, Batch Late: Received today)
    const bEarlyPkg = await p11.prisma.materialInventory.create({
      data: {
        materialId: packagingMaterialId,
        supplierId,
        batchNumber: `BATCH-P11-PKG-EARLY-${randomUUID().slice(0, 4)}`,
        currentStock: 200,
        qcStatus: 'GOOD',
        receivingDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    });
    batchEarlyPkgId = bEarlyPkg.id;

    const bLatePkg = await p11.prisma.materialInventory.create({
      data: {
        materialId: packagingMaterialId,
        supplierId,
        batchNumber: `BATCH-P11-PKG-LATE-${randomUUID().slice(0, 4)}`,
        currentStock: 300,
        qcStatus: 'GOOD',
        receivingDate: new Date(),
      },
    });
    batchLatePkgId = bLatePkg.id;
  });

  afterAll(async () => {
    await p11.prisma.inventoryTransaction.deleteMany({
      where: { materialId: { in: [rawMaterialId, packagingMaterialId] } },
    });
    await p11.prisma.materialInventory.deleteMany({
      where: { materialId: { in: [rawMaterialId, packagingMaterialId] } },
    });
    await p11.prisma.materialItem.deleteMany({
      where: { id: { in: [rawMaterialId, packagingMaterialId] } },
    });
    await p11.prisma.supplier.deleteMany({
      where: { id: supplierId },
    });
    await p11.app.close();
  });

  it('1. Rejects raw material picking of newer batch when earlier expiring batch is available (BUS-RULE-052)', async () => {
    const res = await request(p11.app.getHttpServer())
      .post('/warehouse/picking/validate')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        materialId: rawMaterialId,
        batchId: batchLateRawId,
        quantity: 10,
      });

    expect(res.status).toBe(400);
    const msg = p11Message(res);
    expect(msg).toContain('FEFO VIOLATION');
  });

  it('2. Allows raw material picking of the earliest expiring batch (FEFO conformant)', async () => {
    const res = await request(p11.app.getHttpServer())
      .post('/warehouse/picking/validate')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        materialId: rawMaterialId,
        batchId: batchEarlyRawId,
        quantity: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.valid).toBe(true);
    expect(res.body.strategy).toBe('FEFO');
  });

  it('3. Rejects packaging material picking of newer batch when earlier received batch is available (FIFO / BUS-RULE-031)', async () => {
    const res = await request(p11.app.getHttpServer())
      .post('/warehouse/picking/validate')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        materialId: packagingMaterialId,
        batchId: batchLatePkgId,
        quantity: 50,
      });

    expect(res.status).toBe(400);
    const msg = p11Message(res);
    expect(msg).toContain('FIFO VIOLATION');
  });

  it('4. Successfully executes picking on valid FEFO batch and updates ledger atomically', async () => {
    const res = await request(p11.app.getHttpServer())
      .post('/warehouse/picking/execute')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        materialId: rawMaterialId,
        batchId: batchEarlyRawId,
        quantity: 15,
        referenceNo: 'PICK-WO-2026-001',
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.deductedQty).toBe(15);
    expect(res.body.remainingBatchStock).toBe(25);

    // Verify batch currentStock in DB is exactly 25
    const batch = await p11.prisma.materialInventory.findUnique({
      where: { id: batchEarlyRawId },
    });
    expect(Number(batch!.currentStock)).toBe(25);

    // Verify material stockQty decremented from 100 to 85
    const mat = await p11.prisma.materialItem.findUnique({
      where: { id: rawMaterialId },
    });
    expect(Number(mat!.stockQty)).toBe(85);

    // Verify ledger entry
    const tx = await p11.prisma.inventoryTransaction.findFirst({
      where: { inventoryId: batchEarlyRawId, type: 'OUTBOUND' },
    });
    expect(tx).toBeDefined();
    expect(Number(tx!.quantity)).toBe(15);
  });

  it('5. Enforces No-Negative-Stock invariant: rejects picking exceeding available batch stock', async () => {
    const res = await request(p11.app.getHttpServer())
      .post('/warehouse/picking/execute')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        materialId: rawMaterialId,
        batchId: batchEarlyRawId,
        quantity: 9999, // Exceeds available stock
        referenceNo: 'PICK-OVERFLOW-TEST',
      });

    expect(res.status).toBe(400);
    const msg = p11Message(res);
    expect(msg).toContain('Insufficient stock in batch');

    // Verify stock never went negative
    const batch = await p11.prisma.materialInventory.findUnique({
      where: { id: batchEarlyRawId },
    });
    expect(Number(batch!.currentStock)).toBeGreaterThanOrEqual(0);
  });
});
