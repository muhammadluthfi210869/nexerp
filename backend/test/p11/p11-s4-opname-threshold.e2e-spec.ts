import request from 'supertest';
import { bootP11App, P11App, p11Message } from './p11-http-harness';
import { randomUUID } from 'crypto';

describe('P11-S4: Stock Opname Variance & Threshold Escalation (AC-P11-04)', () => {
  let p11: P11App;
  let warehouseToken: string;
  let managerUser: { user: any; token: string };
  let warehouseId: string;
  let materialLowId: string;
  let materialHighId: string;

  beforeAll(async () => {
    p11 = await bootP11App();

    const wh = await p11.createUser('WH_S4', ['WAREHOUSE']);
    warehouseToken = wh.token;

    // Create Manager with PIN
    managerUser = await p11.createUser(
      'MGR_S4',
      ['SUPER_ADMIN', 'DIRECTOR'],
      undefined,
      '889900',
    );

    // Create warehouse
    const whEntity = await p11.prisma.warehouse.create({
      data: {
        name: `nex_p11_wh_s4_${randomUUID().slice(0, 8)}`,
        status: 'ACTIVE',
      },
    });
    warehouseId = whEntity.id;

    // Create material for low loss test (unitPrice: 50.000)
    const matLow = await p11.prisma.materialItem.create({
      data: {
        name: `nex_p11_mat_low_s4_${randomUUID().slice(0, 8)}`,
        code: `MAT-P11-LOW-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 50000,
        minLevel: 10,
        maxLevel: 500,
        reorderPoint: 20,
        stockQty: 50,
      },
    });
    materialLowId = matLow.id;

    // Create material for high loss test (unitPrice: 300.000)
    const matHigh = await p11.prisma.materialItem.create({
      data: {
        name: `nex_p11_mat_high_s4_${randomUUID().slice(0, 8)}`,
        code: `MAT-P11-HIGH-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 300000,
        minLevel: 10,
        maxLevel: 500,
        reorderPoint: 20,
        stockQty: 50,
      },
    });
    materialHighId = matHigh.id;
  });

  afterAll(async () => {
    await p11.prisma.stockOpnameItem.deleteMany({
      where: { materialId: { in: [materialLowId, materialHighId] } },
    });
    await p11.prisma.stockOpname.deleteMany({
      where: { warehouseId },
    });
    await p11.prisma.inventoryTransaction.deleteMany({
      where: { materialId: { in: [materialLowId, materialHighId] } },
    });
    await p11.prisma.materialItem.deleteMany({
      where: { id: { in: [materialLowId, materialHighId] } },
    });
    await p11.prisma.warehouse.deleteMany({
      where: { id: warehouseId },
    });
    await p11.app.close();
  });

  it('1. Auto-approves Stock Opname with variance loss <= Rp 500.000 (BUS-RULE-049)', async () => {
    // Loss: 4 KG difference @ Rp 50.000 = Rp 200.000 <= 500.000
    const createRes = await request(p11.app.getHttpServer())
      .post('/warehouse/opname')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        warehouseId,
        picId: managerUser.user.id,
        notes: 'Opname rutin mingguan - low variance',
        items: [
          {
            materialId: materialLowId,
            systemQty: 50,
            actualQty: 46, // Loss of 4 KG = Rp 200.000
          },
        ],
      });

    expect(createRes.status).toBe(201);
    const opnameId = createRes.body.id;

    // Approve opname
    const approveRes = await request(p11.app.getHttpServer())
      .post(`/warehouse/opname/${opnameId}/approve`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({});

    expect([200, 201]).toContain(approveRes.status);
    expect(approveRes.body.status).toBe('COMPLETED');
    expect(approveRes.body.approvalStatus).toBe('APPROVED');
    expect(Number(approveRes.body.totalLossValue)).toBe(200000);

    // Verify stockQty in MaterialItem was adjusted to 46
    const mat = await p11.prisma.materialItem.findUnique({
      where: { id: materialLowId },
    });
    expect(Number(mat!.stockQty)).toBe(46);
  });

  it('2. Escalate to PENDING_APPROVAL when variance loss > Rp 500.000', async () => {
    // Loss: 5 KG difference @ Rp 300.000 = Rp 1.500.000 > 500.000
    const createRes = await request(p11.app.getHttpServer())
      .post('/warehouse/opname')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        warehouseId,
        picId: managerUser.user.id,
        notes: 'Opname bulanan - high variance',
        items: [
          {
            materialId: materialHighId,
            systemQty: 50,
            actualQty: 45, // Loss of 5 KG = Rp 1.500.000
          },
        ],
      });

    expect(createRes.status).toBe(201);
    const opnameId = createRes.body.id;

    // Standard approval attempt without PIN
    const approveRes = await request(p11.app.getHttpServer())
      .post(`/warehouse/opname/${opnameId}/approve`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({});

    expect([200, 201]).toContain(approveRes.status);
    expect(approveRes.body.status).toBe('PENDING_APPROVAL');
    expect(approveRes.body.lossValue).toBe(1500000);

    // Check DB status remains WAITING
    const opnameInDb = await p11.prisma.stockOpname.findUnique({
      where: { id: opnameId },
    });
    expect(opnameInDb!.approvalStatus).toBe('WAITING');
  });

  it('3. Rejects approval when invalid Manager PIN is provided', async () => {
    const opname = await p11.prisma.stockOpname.findFirst({
      where: { warehouseId, approvalStatus: 'WAITING' },
    });
    expect(opname).toBeDefined();

    const res = await request(p11.app.getHttpServer())
      .post(`/warehouse/opname/${opname!.id}/approve-pin`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        userId: managerUser.user.id,
        pin: '000000', // Invalid PIN
      });

    expect(res.status).toBe(400);
    const msg = p11Message(res);
    expect(msg).toContain('Invalid escalation PIN');
  });

  it('4. Approves high-loss Opname with valid Manager PIN and executes adjustment', async () => {
    const opname = await p11.prisma.stockOpname.findFirst({
      where: { warehouseId, approvalStatus: 'WAITING' },
    });
    expect(opname).toBeDefined();

    const res = await request(p11.app.getHttpServer())
      .post(`/warehouse/opname/${opname!.id}/approve-pin`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        userId: managerUser.user.id,
        pin: '889900', // Valid PIN
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.approvalStatus).toBe('APPROVED');

    // Verify stockQty in MaterialItem was adjusted to 45
    const mat = await p11.prisma.materialItem.findUnique({
      where: { id: materialHighId },
    });
    expect(Number(mat!.stockQty)).toBe(45);
  });
});
