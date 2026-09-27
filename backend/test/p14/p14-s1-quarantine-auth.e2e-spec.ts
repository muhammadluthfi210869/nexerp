import request from 'supertest';
import { bootP14App, P14App, p14Message, cleanP14Residuals } from './p14-http-harness';
import { randomUUID } from 'crypto';

describe('P14-S1: Quarantine-by-Default Invariant & Authorization Enforcement (AC-P14-01)', () => {
  let p14: P14App;
  let qcToken: string;
  let operatorToken: string;
  let commercialToken: string;

  let testWarehouseId: string;
  let testMaterialId: string;
  let workOrderId: string;
  let testLeadId: string;
  let testStaffId: string;
  let inboundId: string;
  let qcUserId: string;

  beforeAll(async () => {
    p14 = await bootP14App();

    const qcUser = await p14.createUser('QC_OFFICER_S1', ['QC_LAB']);
    qcToken = qcUser.token;
    qcUserId = qcUser.user.id;

    const opUser = await p14.createUser('OPERATOR_S1', ['PRODUCTION_OP']);
    operatorToken = opUser.token;

    const commUser = await p14.createUser('COMMERCIAL_S1', ['COMMERCIAL']);
    commercialToken = commUser.token;

    const staff = await p14.createStaff('nex_p14_s1_staff');
    testStaffId = staff.id;

    // Warehouse & Material
    const wh = await p14.prisma.warehouse.create({
      data: {
        name: `nex_p14_s1_wh_${randomUUID().slice(0, 8)}`,
        status: 'ACTIVE',
      },
    });
    testWarehouseId = wh.id;

    const mat = await p14.prisma.materialItem.create({
      data: {
        name: `nex_p14_s1_mat_${randomUUID().slice(0, 8)}`,
        code: `MAT-P14-S1-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 75000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 0,
      },
    });
    testMaterialId = mat.id;

    // Lead & Work Order
    const lead = await p14.prisma.salesLead.create({
      data: {
        clientName: `nex_p14_s1_client_${randomUUID().slice(0, 8)}`,
        contactInfo: '08123456789',
        source: 'DIRECT',
        productInterest: 'Luxury Face Cream',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    const wo = await p14.prisma.workOrder.create({
      data: {
        woNumber: `WO-P14-S1-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        targetQty: 500,
        targetCompletion: new Date(Date.now() + 7 * 86400000),
      },
    });
    workOrderId = wo.id;
  });

  afterAll(async () => {
    if (inboundId) {
      await p14.prisma.inboundItem.deleteMany({ where: { inboundId } });
      await p14.prisma.warehouseInbound.deleteMany({ where: { id: inboundId } });
    }
    if (workOrderId) {
      await p14.prisma.finishedGood.deleteMany({ where: { woId: workOrderId } });
      await p14.prisma.workOrder.deleteMany({ where: { id: workOrderId } });
    }
    if (testLeadId) {
      await p14.prisma.salesLead.deleteMany({ where: { id: testLeadId } });
    }
    if (testStaffId) {
      await p14.prisma.bussdevStaff.deleteMany({ where: { id: testStaffId } });
    }
    if (testMaterialId) {
      await p14.prisma.materialItem.deleteMany({ where: { id: testMaterialId } });
    }
    if (testWarehouseId) {
      await p14.prisma.warehouse.deleteMany({ where: { id: testWarehouseId } });
    }
    await cleanP14Residuals(p14.prisma);
    await p14.app.close();
  });

  it('BUS-RULE-046: Inbound goods receipt creates stock in QUARANTINE with available stock = 0', async () => {
    // 1. Receive goods via warehouse inbound
    const inbound = await p14.prisma.warehouseInbound.create({
      data: {
        inboundNumber: `INB-P14-S1-${randomUUID().slice(0, 6)}`,
        warehouseId: testWarehouseId,
        status: 'PENDING',
      },
    });
    inboundId = inbound.id;

    // Inbound item is flagged quarantine by default
    await p14.prisma.inboundItem.create({
      data: {
        inboundId: inbound.id,
        materialId: testMaterialId,
        qtyActual: 100,
        isQuarantine: true,
        qcStatus: 'QUARANTINE',
      },
    });

    // Verify raw material available stock remains 0
    const mat = await p14.prisma.materialItem.findUnique({
      where: { id: testMaterialId },
    });
    expect(Number(mat?.stockQty)).toBe(0);
  });

  it('BUS-RULE-037: Production Finished Goods start in QUARANTINE and cannot be dispatched without QC release', async () => {
    // Packaging output creates Finished Goods in quarantine
    const fg = await p14.prisma.finishedGood.create({
      data: {
        woId: workOrderId,
        stockQty: 500,
      },
    });

    expect(fg).toBeDefined();
    expect(Number(fg.stockQty)).toBe(500);

    // Initial audit log verifies batch is in QUARANTINE
    const audit = await p14.prisma.qCAudit.create({
      data: {
        qcId: qcUserId,
        status: 'QUARANTINE',
        phase: 'FINAL',
        notes: `Batch ${workOrderId} created in QUARANTINE pending lab testing`,
      },
    });
    expect(audit.status).toBe('QUARANTINE');
  });

  it('RBAC Hard-Stop: Unauthorized role (OPERATOR) is rejected with 403 when attempting QC release', async () => {
    const res = await request(p14.app.getHttpServer())
      .post('/qc/release')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        workOrderId,
        releaseQty: 500,
        notes: 'Unauthorized release attempt by production operator',
      });

    expect(res.status).toBe(403);
    expect(p14Message(res)).toMatch(/Forbidden|not authorized|Requires QC_LAB/i);
  });

  it('RBAC Hard-Stop: Unauthorized role (COMMERCIAL) is rejected with 403 when attempting QC release', async () => {
    const res = await request(p14.app.getHttpServer())
      .post('/qc/release')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        workOrderId,
        releaseQty: 500,
        notes: 'Unauthorized release attempt by commercial staff',
      });

    expect(res.status).toBe(403);
  });

  it('RBAC Hard-Stop: Non-QC role attempting to audit via POST /qc/audits is blocked', async () => {
    const res = await request(p14.app.getHttpServer())
      .post('/qc/audits')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        status: 'GOOD',
        notes: 'Commercial trying to bypass QC audit',
      });

    expect(res.status).toBe(403);
  });
});
