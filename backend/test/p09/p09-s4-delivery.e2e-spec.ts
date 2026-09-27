import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP09App, P09App, p09Message } from './p09-http-harness';
import { UserRole, SOStatus, ShipStatus } from '@prisma/client';

describe('P09 - S4: Delivery Out & AR Gatekeeper Interlock', () => {
  let p09: P09App;
  let adminToken: string;
  let warehouseToken: string;
  let tenantId: string;
  let leadId: string;
  let sampleId: string;
  let logisticsUserId: string;
  let soIdHeld: string;
  let soIdReleased: string;

  const testPrefix = `nex_p09_s4_${Date.now()}`;

  beforeAll(async () => {
    p09 = await bootP09App();
    tenantId = randomUUID();

    const admin = await p09.createUser(`${testPrefix}_admin`, [UserRole.SUPER_ADMIN], tenantId);
    const wh = await p09.createUser(`${testPrefix}_wh`, [UserRole.WAREHOUSE], tenantId);

    adminToken = admin.token;
    warehouseToken = wh.token;
    logisticsUserId = wh.user.id;

    const bdStaff = await p09.prisma.bussdevStaff.create({
      data: { name: `${testPrefix}_Staff` },
    });

    const lead = await p09.prisma.salesLead.create({
      data: {
        clientName: `${testPrefix}_Client`,
        contactInfo: '08123456783',
        source: 'DIRECT',
        productInterest: 'Cream',
        picId: bdStaff.id,
        organizationId: tenantId,
      },
    });
    leadId = lead.id;

    const sample = await p09.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-${Date.now()}`,
        leadId: lead.id,
        productName: `${testPrefix}_CreamSample`,
        targetFunction: 'Smoothing',
        textureReq: 'Cream',
        colorReq: 'Pink',
        aromaReq: 'Berry',
        stage: 'QUEUE',
      },
    });
    sampleId = sample.id;

    // 1. SO with HELD delivery gatekeeper
    const soHeld = await p09.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-HELD-${Date.now()}`,
        organizationId: tenantId,
        leadId: lead.id,
        sampleId: sample.id,
        salesCategory: 'PRODUKSI',
        totalAmount: 80000000,
        status: SOStatus.ACTIVE,
        deliveryGateStatus: 'HELD',
      },
    });
    soIdHeld = soHeld.id;

    // 2. SO with RELEASED delivery gatekeeper
    const soReleased = await p09.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-REL-${Date.now()}`,
        organizationId: tenantId,
        leadId: lead.id,
        sampleId: sample.id,
        salesCategory: 'PRODUKSI',
        totalAmount: 50000000,
        status: SOStatus.ACTIVE,
        deliveryGateStatus: 'RELEASED',
      },
    });
    soIdReleased = soReleased.id;
  }, 120000);

  afterAll(async () => {
    try {
      await p09.prisma.shipment.deleteMany({
        where: { soId: { in: [soIdHeld, soIdReleased] } },
      });
      await p09.prisma.salesOrder.deleteMany({
        where: { id: { in: [soIdHeld, soIdReleased] } },
      });
      await p09.prisma.sampleRequest.deleteMany({
        where: { id: sampleId },
      });
      await p09.prisma.salesLead.deleteMany({
        where: { id: leadId },
      });
      await p09.prisma.bussdevStaff.deleteMany({
        where: { name: `${testPrefix}_Staff` },
      });
      await p09.prisma.notification.deleteMany({
        where: { user: { email: { contains: testPrefix.toLowerCase().replace(/[^a-z0-9]/g, '_') } } },
      });
      await p09.prisma.user.deleteMany({
        where: { email: { contains: testPrefix.toLowerCase().replace(/[^a-z0-9]/g, '_') } },
      });
    } catch (e) {}
    await p09.app.close();
  });

  it('1. blocks Surat Jalan / shipment dispatch when deliveryGateStatus is HELD (BUS-RULE-006)', async () => {
    const res = await request(p09.app.getHttpServer())
      .post('/fulfillment/shipments')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        soId: soIdHeld,
        logisticsId: logisticsUserId,
        trackingNo: 'EXP-12345',
        notes: 'Trying to dispatch while AR is held',
      });

    expect(res.status).toBe(400);
    expect(p09Message(res.body)).toContain('DELIVERY_GATE_HELD');
  });

  let createdShipmentId: string;

  it('2. creates and dispatches shipment when deliveryGateStatus is RELEASED', async () => {
    const res = await request(p09.app.getHttpServer())
      .post('/fulfillment/shipments')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        soId: soIdReleased,
        logisticsId: logisticsUserId,
        trackingNo: 'EXP-99999',
        notes: 'Dispatched to Jakarta Hub',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.trackingNo).toBe('EXP-99999');
    expect(res.body.status).toBe(ShipStatus.SHIPPED);

    createdShipmentId = res.body.id;

    // Verify SO is advanced to SHIPPED
    const so = await p09.prisma.salesOrder.findUnique({
      where: { id: soIdReleased },
    });
    expect(so?.status).toBe(SOStatus.SHIPPED);
  });

  it('3. confirms delivery and updates status to DELIVERED / COMPLETED', async () => {
    const res = await request(p09.app.getHttpServer())
      .patch(`/fulfillment/shipments/${createdShipmentId}/status`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        status: ShipStatus.DELIVERED,
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(ShipStatus.DELIVERED);
    expect(res.body.deliveredAt).toBeDefined();

    const so = await p09.prisma.salesOrder.findUnique({
      where: { id: soIdReleased },
    });
    expect(so?.status).toBe(SOStatus.COMPLETED);
  });
});
