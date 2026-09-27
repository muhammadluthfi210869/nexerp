import request from 'supertest';
import { bootP11App, P11App } from './p11-http-harness';
import { randomUUID } from 'crypto';

describe('P11-S5: Stock Adjustment, Auto-Journal & Dead Stock Intelligence (AC-P11-05)', () => {
  let p11: P11App;
  let warehouseToken: string;
  let adminToken: string;
  let warehouseId: string;
  let deadMaterialId: string;
  let activeMaterialId: string;

  beforeAll(async () => {
    p11 = await bootP11App();

    const admin = await p11.createUser('ADMIN_S5', ['SUPER_ADMIN']);
    adminToken = admin.token;

    const wh = await p11.createUser('WH_S5', ['WAREHOUSE']);
    warehouseToken = wh.token;

    const whEntity = await p11.prisma.warehouse.create({
      data: {
        name: `nex_p11_wh_s5_${randomUUID().slice(0, 8)}`,
        status: 'ACTIVE',
      },
    });
    warehouseId = whEntity.id;

    // Create dead stock material (stock > 0, idle > 180 days)
    const deadMat = await p11.prisma.materialItem.create({
      data: {
        name: `nex_p11_mat_dead_s5_${randomUUID().slice(0, 8)}`,
        code: `MAT-P11-DEAD-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 120000,
        minLevel: 10,
        maxLevel: 500,
        reorderPoint: 20,
        stockQty: 30,
      },
    });
    deadMaterialId = deadMat.id;

    // Create old transaction (200 days ago) for dead stock
    const twoHundredDaysAgo = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
    await p11.prisma.inventoryTransaction.create({
      data: {
        materialId: deadMaterialId,
        type: 'INBOUND',
        quantity: 30,
        referenceNo: 'INIT-OLD-STOCK',
        performedBy: 'SYSTEM_SEEDED',
        createdAt: twoHundredDaysAgo,
      },
    });

    // Create active material (has movement 10 days ago)
    const activeMat = await p11.prisma.materialItem.create({
      data: {
        name: `nex_p11_mat_active_s5_${randomUUID().slice(0, 8)}`,
        code: `MAT-P11-ACT-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 80000,
        minLevel: 10,
        maxLevel: 500,
        reorderPoint: 20,
        stockQty: 40,
      },
    });
    activeMaterialId = activeMat.id;

    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    await p11.prisma.inventoryTransaction.create({
      data: {
        materialId: activeMaterialId,
        type: 'INBOUND',
        quantity: 40,
        referenceNo: 'INIT-RECENT-STOCK',
        performedBy: 'SYSTEM_SEEDED',
        createdAt: tenDaysAgo,
      },
    });
  });

  afterAll(async () => {
    await p11.prisma.stockAdjustmentItem.deleteMany({
      where: { materialId: { in: [deadMaterialId, activeMaterialId] } },
    });
    await p11.prisma.stockAdjustment.deleteMany({
      where: { warehouseId },
    });
    await p11.prisma.inventoryTransaction.deleteMany({
      where: { materialId: { in: [deadMaterialId, activeMaterialId] } },
    });
    await p11.prisma.materialItem.deleteMany({
      where: { id: { in: [deadMaterialId, activeMaterialId] } },
    });
    await p11.prisma.warehouse.deleteMany({
      where: { id: warehouseId },
    });
    await p11.app.close();
  });

  it('1. Detects dead stock items with stock > 0 and no movement for > 180 days (BUS-RULE-050)', async () => {
    const res = await request(p11.app.getHttpServer())
      .get('/warehouse/stock-intelligence/dead-stock')
      .set('Authorization', `Bearer ${warehouseToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Verify dead material is flagged
    const deadItem = res.body.find((item: any) => item.id === deadMaterialId);
    expect(deadItem).toBeDefined();
    expect(deadItem.status).toBe('DEAD_STOCK');
    expect(deadItem.daysIdle).toBeGreaterThanOrEqual(180);
    expect(Number(deadItem.stockQty)).toBe(30);

    // Verify active material is NOT flagged as dead stock
    const activeItem = res.body.find((item: any) => item.id === activeMaterialId);
    expect(activeItem).toBeUndefined();
  });

  it('2. Creates and approves Stock Adjustment WRITE_OFF with automated journal entry (BUS-RULE-055)', async () => {
    // Create adjustment for damaged/expired goods (5 KG)
    const createRes = await request(p11.app.getHttpServer())
      .post('/warehouse/adjustments')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        materialId: deadMaterialId,
        type: 'WRITE_OFF',
        qty: 5,
        warehouseId,
        notes: 'P11 Write off expired test stock',
      });

    expect(createRes.status).toBe(201);
    const adjId = createRes.body.id;

    // Approve adjustment
    const approveRes = await request(p11.app.getHttpServer())
      .post(`/warehouse/adjustments/${adjId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'APPROVED',
        userId: 'P11_ADMIN_TEST',
      });

    expect([200, 201]).toContain(approveRes.status);

    // Verify material stock decremented from 30 to 25
    const mat = await p11.prisma.materialItem.findUnique({
      where: { id: deadMaterialId },
    });
    expect(Number(mat!.stockQty)).toBe(25);

    // Verify ledger entry recorded
    const tx = await p11.prisma.inventoryTransaction.findFirst({
      where: { referenceNo: `ADJ-${adjId.slice(0, 8)}`, type: 'ADJUSTMENT' },
    });
    expect(tx).toBeDefined();
    expect(Number(tx!.quantity)).toBe(5);

    // Verify automated Journal Entry created (Dr Expense / Cr Inventory Asset)
    const journal = await p11.prisma.journalEntry.findFirst({
      where: { reference: `ADJ-OPN-${adjId.slice(0, 8)}` },
      include: { lines: { include: { account: true } } },
    });
    expect(journal).toBeDefined();
    expect(journal!.lines).toHaveLength(2);

    const debitLine = journal!.lines.find((l) => Number(l.debit) > 0);
    const creditLine = journal!.lines.find((l) => Number(l.credit) > 0);
    expect(debitLine).toBeDefined();
    expect(creditLine).toBeDefined();
    // 5 KG * 120.000 = 600.000
    expect(Number(debitLine!.debit)).toBe(600000);
    expect(Number(creditLine!.credit)).toBe(600000);
  });

  it('3. Fetches ABC analysis and critical stock items without errors', async () => {
    const abcRes = await request(p11.app.getHttpServer())
      .get('/warehouse/stock-intelligence/abc')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(abcRes.status).toBe(200);
    expect(Array.isArray(abcRes.body)).toBe(true);

    const critRes = await request(p11.app.getHttpServer())
      .get('/warehouse/stock-intelligence/critical')
      .set('Authorization', `Bearer ${warehouseToken}`);

    expect(critRes.status).toBe(200);
    expect(Array.isArray(critRes.body)).toBe(true);
  });
});
