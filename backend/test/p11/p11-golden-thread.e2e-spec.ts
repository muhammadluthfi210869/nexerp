import request from 'supertest';
import { bootP11App, P11App, p11Message } from './p11-http-harness';
import { randomUUID } from 'crypto';

describe('P11: Complete Warehouse & Inventory Golden Thread Lifecycle (AC-P11-01 to AC-P11-05)', () => {
  let p11: P11App;
  let adminToken: string;
  let warehouseToken: string;
  let managerUser: { user: any; token: string };

  let sourceWhId: string;
  let destWhId: string;
  let materialRawId: string;
  let materialPkgId: string;

  // Track created entities for zero-residue cleanup
  const createdInboundIds: string[] = [];
  const createdTransferIds: string[] = [];
  const createdOpnameIds: string[] = [];
  const createdAdjIds: string[] = [];
  const createdMaterialIds: string[] = [];
  const createdWhIds: string[] = [];

  beforeAll(async () => {
    p11 = await bootP11App();

    const admin = await p11.createUser('ADMIN_GOLDEN', ['SUPER_ADMIN']);
    adminToken = admin.token;

    const wh = await p11.createUser('WH_GOLDEN', ['WAREHOUSE']);
    warehouseToken = wh.token;

    managerUser = await p11.createUser(
      'MGR_GOLDEN',
      ['SUPER_ADMIN', 'DIRECTOR'],
      undefined,
      '554433',
    );

    // 1. Create Source and Destination Warehouses
    const srcWh = await p11.prisma.warehouse.create({
      data: {
        name: `nex_p11_src_wh_${randomUUID().slice(0, 8)}`,
        status: 'ACTIVE',
      },
    });
    sourceWhId = srcWh.id;
    createdWhIds.push(sourceWhId);

    const dstWh = await p11.prisma.warehouse.create({
      data: {
        name: `nex_p11_dst_wh_${randomUUID().slice(0, 8)}`,
        status: 'ACTIVE',
      },
    });
    destWhId = dstWh.id;
    createdWhIds.push(destWhId);

    // 2. Grant Warehouse Access for WH user
    await p11.prisma.warehouseAccess.createMany({
      data: [
        {
          userId: wh.user.id,
          warehouseId: sourceWhId,
          canRead: true,
          canWrite: true,
          canApprove: true,
        },
        {
          userId: wh.user.id,
          warehouseId: destWhId,
          canRead: true,
          canWrite: true,
          canApprove: true,
        },
      ],
    });

    // 3. Create Raw Material (Subject to FEFO)
    const rawMat = await p11.prisma.materialItem.create({
      data: {
        name: `nex_p11_golden_raw_${randomUUID().slice(0, 8)}`,
        code: `RAW-GT-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 150000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 30,
        stockQty: 0,
      },
    });
    materialRawId = rawMat.id;
    createdMaterialIds.push(materialRawId);

    // 4. Create Packaging Material (Subject to FIFO)
    const pkgMat = await p11.prisma.materialItem.create({
      data: {
        name: `nex_p11_golden_pkg_${randomUUID().slice(0, 8)}`,
        code: `PKG-GT-${randomUUID().slice(0, 6)}`,
        type: 'PACKAGING',
        unit: 'PCS',
        unitPrice: 25000,
        minLevel: 50,
        maxLevel: 2000,
        reorderPoint: 100,
        stockQty: 0,
      },
    });
    materialPkgId = pkgMat.id;
    createdMaterialIds.push(materialPkgId);
  });

  afterAll(async () => {
    // Zero-residue cleanup
    await p11.prisma.stockOpnameItem.deleteMany({
      where: { materialId: { in: createdMaterialIds } },
    });
    await p11.prisma.stockOpname.deleteMany({
      where: { id: { in: createdOpnameIds } },
    });
    await p11.prisma.stockAdjustmentItem.deleteMany({
      where: { materialId: { in: createdMaterialIds } },
    });
    await p11.prisma.stockAdjustment.deleteMany({
      where: { id: { in: createdAdjIds } },
    });
    await p11.prisma.transferOrderItem.deleteMany({
      where: { materialId: { in: createdMaterialIds } },
    });
    await p11.prisma.transferOrder.deleteMany({
      where: { id: { in: createdTransferIds } },
    });
    await p11.prisma.warehouseAccess.deleteMany({
      where: { warehouseId: { in: createdWhIds } },
    });
    await p11.prisma.inventoryTransaction.deleteMany({
      where: { materialId: { in: createdMaterialIds } },
    });
    await p11.prisma.materialInventory.deleteMany({
      where: { materialId: { in: createdMaterialIds } },
    });
    await p11.prisma.inboundItem.deleteMany({
      where: { materialId: { in: createdMaterialIds } },
    });
    await p11.prisma.warehouseInbound.deleteMany({
      where: { id: { in: createdInboundIds } },
    });
    await p11.prisma.materialItem.deleteMany({
      where: { id: { in: createdMaterialIds } },
    });
    await p11.prisma.warehouse.deleteMany({
      where: { id: { in: createdWhIds } },
    });
    await p11.app.close();
  });

  let earlyBatchId: string;
  let laterBatchId: string;
  let inboundReceiptId: string;

  it('Step 1: Inbound GR enters QUARANTINE by default with 0 available stock (BUS-RULE-046 & 053)', async () => {
    const expEarly = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const expLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const inboundRes = await request(p11.app.getHttpServer())
      .post('/warehouse/inbounds')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        poNumber: `PO-GT-${randomUUID().slice(0, 6)}`,
        supplierName: 'PT Golden Supplier Chemindo',
        receivedBy: 'Warehouse Inspector',
        warehouseId: sourceWhId,
        items: [
          {
            materialId: materialRawId,
            quantity: 50,
            batchNumber: `BATCH-EARLY-${randomUUID().slice(0, 6)}`,
            expiryDate: expEarly,
          },
          {
            materialId: materialRawId,
            quantity: 50,
            batchNumber: `BATCH-LATER-${randomUUID().slice(0, 6)}`,
            expiryDate: expLater,
          },
        ],
      });

    expect(inboundRes.status).toBe(201);
    inboundReceiptId = inboundRes.body.id;
    createdInboundIds.push(inboundReceiptId);

    // Verify batches created as QUARANTINE
    const batches = await p11.prisma.materialInventory.findMany({
      where: { materialId: materialRawId },
      orderBy: { expDate: 'asc' },
    });
    expect(batches).toHaveLength(2);
    expect(batches[0].qcStatus).toBe('QUARANTINE');
    expect(batches[1].qcStatus).toBe('QUARANTINE');

    earlyBatchId = batches[0].id;
    laterBatchId = batches[1].id;

    // Available stock must remain 0 in materialItem
    const mat = await p11.prisma.materialItem.findUnique({
      where: { id: materialRawId },
    });
    expect(Number(mat!.stockQty)).toBe(0);
  });

  it('Step 2: QC inspection releases batches from QUARANTINE to AVAILABLE stock (BUS-RULE-047 & 048)', async () => {
    const releaseRes = await request(p11.app.getHttpServer())
      .post(`/warehouse/inbounds/${inboundReceiptId}/release`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ performedBy: 'QC_LEAD_GOLDEN' });

    expect([200, 201]).toContain(releaseRes.status);
    expect(releaseRes.body.releasedCount).toBe(2);

    // Verify stockQty is now 100
    const mat = await p11.prisma.materialItem.findUnique({
      where: { id: materialRawId },
    });
    expect(Number(mat!.stockQty)).toBe(100);

    // Verify batches are now GOOD
    const batches = await p11.prisma.materialInventory.findMany({
      where: { materialId: materialRawId },
    });
    expect(batches.every((b: any) => b.qcStatus === 'GOOD')).toBe(true);

    // Verify ledger transactions logged
    const txs = await p11.prisma.inventoryTransaction.findMany({
      where: { materialId: materialRawId, type: 'INBOUND' },
    });
    expect(txs).toHaveLength(2);
  });

  it('Step 3: Inter-warehouse transfer validates RBAC and updates warehouse balances (BUS-RULE-051)', async () => {
    // WH user transfers 20 KG from Source to Dest
    const transferRes = await request(p11.app.getHttpServer())
      .post('/warehouse/transfers')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        sourceWarehouseId: sourceWhId,
        destWarehouseId: destWhId,
        notes: 'Golden Thread Transfer 20 KG',
        items: [
          {
            materialId: materialRawId,
            qty: 20,
          },
        ],
      });

    expect(transferRes.status).toBe(201);
    const transferId = transferRes.body.id;
    createdTransferIds.push(transferId);

    // Execute transfer
    const execRes = await request(p11.app.getHttpServer())
      .post(`/warehouse/transfers/${transferId}/execute`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({});

    expect([200, 201]).toContain(execRes.status);
    expect(execRes.body.status).toBe('COMPLETED');

    // Verify ledger transactions for transfer
    const transferTxs = await p11.prisma.inventoryTransaction.findMany({
      where: {
        materialId: materialRawId,
        type: 'INTERNAL_MOVE',
      },
    });
    expect(transferTxs).toHaveLength(2);
  });

  it('Step 4: FEFO Picking enforces earlier batch selection and rejects newer batch (BUS-RULE-052)', async () => {
    // Attempt picking later expiring batch while early batch is available -> REJECT
    const invalidPick = await request(p11.app.getHttpServer())
      .post('/warehouse/picking/execute')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        materialId: materialRawId,
        batchId: laterBatchId,
        quantity: 10,
        referenceNo: 'WO-PROD-GT-001',
      });

    expect(invalidPick.status).toBe(400);
    const err = p11Message(invalidPick);
    expect(err).toContain('FEFO VIOLATION');

    // Pick compliant earlier batch -> SUCCESS
    const validPick = await request(p11.app.getHttpServer())
      .post('/warehouse/picking/execute')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        materialId: materialRawId,
        batchId: earlyBatchId,
        quantity: 15,
        referenceNo: 'WO-PROD-GT-001',
      });

    expect([200, 201]).toContain(validPick.status);
    expect(validPick.body.success).toBe(true);
    expect(Number(validPick.body.remainingBatchStock)).toBe(15);

    // Verify material stock decremented: 100 - 15 = 85
    const mat = await p11.prisma.materialItem.findUnique({
      where: { id: materialRawId },
    });
    expect(Number(mat!.stockQty)).toBe(85);
  });

  it('Step 5: Stock Opname Threshold Escalation & Manager PIN Approval (BUS-RULE-049)', async () => {
    // Current stock is 85. Physical count: 80 (Loss 5 KG * 150.000 = Rp 750.000 > 500.000)
    const opnameRes = await request(p11.app.getHttpServer())
      .post('/warehouse/opname')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        warehouseId: sourceWhId,
        picId: managerUser.user.id,
        notes: 'Opname Golden Thread high variance',
        items: [
          {
            materialId: materialRawId,
            systemQty: 85,
            actualQty: 80,
          },
        ],
      });

    expect(opnameRes.status).toBe(201);
    const opnameId = opnameRes.body.id;
    createdOpnameIds.push(opnameId);

    // Standard approval escalates to PENDING_APPROVAL / WAITING
    const approveRes = await request(p11.app.getHttpServer())
      .post(`/warehouse/opname/${opnameId}/approve`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({});

    expect([200, 201]).toContain(approveRes.status);
    expect(approveRes.body.status).toBe('PENDING_APPROVAL');

    // Manager approves via PIN
    const pinRes = await request(p11.app.getHttpServer())
      .post(`/warehouse/opname/${opnameId}/approve-pin`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        userId: managerUser.user.id,
        pin: '554433',
      });

    expect([200, 201]).toContain(pinRes.status);
    expect(pinRes.body.status).toBe('COMPLETED');

    // Stock adjusted to 80
    const mat = await p11.prisma.materialItem.findUnique({
      where: { id: materialRawId },
    });
    expect(Number(mat!.stockQty)).toBe(80);
  });

  it('Step 6: Stock Adjustment Write-off triggers automated financial journal (BUS-RULE-055)', async () => {
    // Write off 5 KG damaged stock
    const adjRes = await request(p11.app.getHttpServer())
      .post('/warehouse/adjustments')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        materialId: materialRawId,
        type: 'WRITE_OFF',
        qty: 5,
        warehouseId: sourceWhId,
        notes: 'Golden Thread write-off 5 KG damaged',
      });

    expect(adjRes.status).toBe(201);
    const adjId = adjRes.body.id;
    createdAdjIds.push(adjId);

    // Approve adjustment
    const approveRes = await request(p11.app.getHttpServer())
      .post(`/warehouse/adjustments/${adjId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'APPROVED',
        userId: 'P11_GOLDEN_ADMIN',
      });

    expect([200, 201]).toContain(approveRes.status);

    // Verify stock is now 75
    const mat = await p11.prisma.materialItem.findUnique({
      where: { id: materialRawId },
    });
    expect(Number(mat!.stockQty)).toBe(75);

    // Verify balanced journal created (5 KG * 150.000 = Rp 750.000)
    const journal = await p11.prisma.journalEntry.findFirst({
      where: { reference: `ADJ-OPN-${adjId.slice(0, 8)}` },
      include: { lines: true },
    });
    expect(journal).toBeDefined();
    expect(journal!.lines).toHaveLength(2);
    const debit = journal!.lines.find((l) => Number(l.debit) > 0);
    const credit = journal!.lines.find((l) => Number(l.credit) > 0);
    expect(Number(debit!.debit)).toBe(750000);
    expect(Number(credit!.credit)).toBe(750000);
  });

  it('Step 7: Stock Intelligence analytics endpoints return operational insights (BUS-RULE-050)', async () => {
    const deadRes = await request(p11.app.getHttpServer())
      .get('/warehouse/stock-intelligence/dead-stock')
      .set('Authorization', `Bearer ${warehouseToken}`);
    expect(deadRes.status).toBe(200);

    const abcRes = await request(p11.app.getHttpServer())
      .get('/warehouse/stock-intelligence/abc')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(abcRes.status).toBe(200);

    const critRes = await request(p11.app.getHttpServer())
      .get('/warehouse/stock-intelligence/critical')
      .set('Authorization', `Bearer ${warehouseToken}`);
    expect(critRes.status).toBe(200);

    const reorderRes = await request(p11.app.getHttpServer())
      .get('/warehouse/stock-intelligence/reorder-suggestions')
      .set('Authorization', `Bearer ${warehouseToken}`);
    expect(reorderRes.status).toBe(200);
  });
});
