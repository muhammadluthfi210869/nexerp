import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP09App, P09App, p09Message } from './p09-http-harness';
import { UserRole, SOStatus } from '@prisma/client';

describe('P09 - S1: Sales Order Core & Amendments', () => {
  let p09: P09App;
  let adminToken: string;
  let commercialToken: string;
  let tenantId: string;
  let leadId: string;
  let sampleId: string;
  let materialId: string;
  let inactiveLeadId: string;

  const testPrefix = `nex_p09_s1_${Date.now()}`;

  beforeAll(async () => {
    p09 = await bootP09App();
    tenantId = randomUUID();

    const admin = await p09.createUser(`${testPrefix}_admin`, [UserRole.SUPER_ADMIN], tenantId);
    const comm = await p09.createUser(`${testPrefix}_commercial`, [UserRole.COMMERCIAL], tenantId);

    adminToken = admin.token;
    commercialToken = comm.token;

    // Create prerequisite entities in DB
    const bdStaff = await p09.prisma.bussdevStaff.create({
      data: {
        name: `${testPrefix}_Staff`,
      },
    });

    const activeLead = await p09.prisma.salesLead.create({
      data: {
        clientName: `${testPrefix}_ActiveClient`,
        contactInfo: '08123456789',
        source: 'DIRECT',
        productInterest: 'Serum',
        picId: bdStaff.id,
        organizationId: tenantId,
      },
    });
    leadId = activeLead.id;

    const inactiveLead = await p09.prisma.salesLead.create({
      data: {
        clientName: `${testPrefix}_InactiveClient`,
        contactInfo: '08123456780',
        source: 'DIRECT',
        productInterest: 'Cream',
        picId: bdStaff.id,
        status: 'LOST',
        organizationId: tenantId,
      },
    });
    inactiveLeadId = inactiveLead.id;

    const sample = await p09.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-${Date.now()}`,
        leadId: activeLead.id,
        productName: `${testPrefix}_SampleProduct`,
        targetFunction: 'Moisturizing',
        textureReq: 'Gel',
        colorReq: 'Clear',
        aromaReq: 'Unscented',
        stage: 'QUEUE',
      },
    });
    sampleId = sample.id;

    const material = await p09.prisma.materialItem.create({
      data: {
        name: `${testPrefix}_MaterialItem`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 10000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 500,
      },
    });
    materialId = material.id;
  }, 120000);

  afterAll(async () => {
    // Cleanup entities created for S1
    try {
      await p09.prisma.salesOrderItem.deleteMany({
        where: { salesOrder: { orderNumber: { startsWith: 'SO-' } } },
      });
      await p09.prisma.salesOrder.deleteMany({
        where: { leadId: { in: [leadId, inactiveLeadId] } },
      });
      await p09.prisma.sampleRequest.deleteMany({
        where: { id: sampleId },
      });
      await p09.prisma.salesLead.deleteMany({
        where: { id: { in: [leadId, inactiveLeadId] } },
      });
      await p09.prisma.materialItem.deleteMany({
        where: { id: materialId },
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
    } catch (e) {
      // Ignore cleanup error in case rows already cleared
    }
    await p09.app.close();
  });

  it('1. rejects creation without mandatory salesCategory (BUS-RULE-014)', async () => {
    const res = await request(p09.app.getHttpServer())
      .post('/commercial/sales-orders')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        leadId,
        sampleId,
        salesCategory: '',
        items: [
          {
            materialId,
            productName: 'Facial Serum 30ml',
            quantity: 1000,
            unitPrice: 35000,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(p09Message(res.body)).toContain('SO_CATEGORY_REQUIRED');
  });

  it('2. rejects creation with empty cart / no items (BUS-RULE-013)', async () => {
    const res = await request(p09.app.getHttpServer())
      .post('/commercial/sales-orders')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        leadId,
        sampleId,
        salesCategory: 'PRODUKSI',
        items: [],
      });

    expect(res.status).toBe(400);
    expect(p09Message(res.body)).toContain('CART_EMPTY');
  });

  it('3. rejects creation if customer/lead is inactive (BUS-RULE-001)', async () => {
    const res = await request(p09.app.getHttpServer())
      .post('/commercial/sales-orders')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        leadId: inactiveLeadId,
        sampleId,
        salesCategory: 'PRODUKSI',
        items: [
          {
            materialId,
            productName: 'Day Cream SPF 30',
            quantity: 500,
            unitPrice: 25000,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(p09Message(res.body)).toContain('CUSTOMER_INACTIVE');
  });

  let createdSoId: string;

  it('4. creates SO successfully with deterministic total and HELD gatekeeper', async () => {
    const res = await request(p09.app.getHttpServer())
      .post('/commercial/sales-orders')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        leadId,
        sampleId,
        salesCategory: 'PRODUKSI',
        brandName: 'Glowing Star',
        items: [
          {
            materialId,
            productName: 'Brightening Serum 30ml',
            quantity: 2000,
            unitPrice: 30000,
            netto: 30,
          },
          {
            materialId,
            productName: 'Hydrating Toner 100ml',
            quantity: 1000,
            unitPrice: 40000,
            netto: 100,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.orderNumber).toMatch(/^SO-/);
    // 2000 * 30000 + 1000 * 40000 = 60,000,000 + 40,000,000 = 100,000,000
    expect(Number(res.body.totalAmount)).toBe(100000000);
    expect(res.body.status).toBe(SOStatus.PENDING_DP);
    expect(res.body.deliveryGateStatus).toBe('HELD');

    createdSoId = res.body.id;
  });

  it('5. handles amendment review workflow post-DP and lifts hold on approval (BUS-RULE-002)', async () => {
    // Set SO to ACTIVE (simulating DP received)
    await p09.prisma.salesOrder.update({
      where: { id: createdSoId },
      data: { status: SOStatus.ACTIVE },
    });

    // Request amendment
    const amendRes = await request(p09.app.getHttpServer())
      .post(`/commercial/sales-orders/${createdSoId}/amend`)
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        reason: 'Customer requests change packaging volume from 30ml to 50ml',
      });

    expect(amendRes.status).toBe(201);
    expect(amendRes.body.status).toBe(SOStatus.AMENDMENT_REVIEW);
    expect(amendRes.body.isAmendmentHeld).toBe(true);
    expect(amendRes.body.amendmentReason).toContain('packaging volume');

    // Approve amendment
    const approveRes = await request(p09.app.getHttpServer())
      .post(`/commercial/sales-orders/${createdSoId}/approve-amendment`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(approveRes.status).toBe(201);
    expect(approveRes.body.status).toBe(SOStatus.ACTIVE);
    expect(approveRes.body.isAmendmentHeld).toBe(false);
  });

  it('6. strictly forbids amendment once IN_PRODUCTION (BUS-RULE-002)', async () => {
    // Advance SO to IN_PRODUCTION
    await p09.prisma.salesOrder.update({
      where: { id: createdSoId },
      data: { status: SOStatus.IN_PRODUCTION },
    });

    const res = await request(p09.app.getHttpServer())
      .post(`/commercial/sales-orders/${createdSoId}/amend`)
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        reason: 'Customer wants to change scent',
      });

    expect(res.status).toBe(400);
    expect(p09Message(res.body)).toContain('IN_PRODUCTION_IMMUTABLE');
  });

  it('7. updates delivery gatekeeper status (BUS-RULE-006)', async () => {
    const res = await request(p09.app.getHttpServer())
      .post(`/commercial/sales-orders/${createdSoId}/delivery-gate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RELEASED' });

    expect(res.status).toBe(201);
    expect(res.body.deliveryGateStatus).toBe('RELEASED');
  });
});
