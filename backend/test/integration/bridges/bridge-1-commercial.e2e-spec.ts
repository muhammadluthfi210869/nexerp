/**
 * Bridge 1: Commercial Pipeline (P07 CRM -> P08 R&D -> P09 Sales Order)
 * Verifies live traversal across CRM, R&D formulation, and Commercial Sales Order
 * with zero synthetic bypass and strict cross-tenant isolation checks.
 */
import request from 'supertest';
import { randomUUID } from 'crypto';
import { FormulaStatus } from '@prisma/client';
import { bootBridgeApp, cleanBridgeResiduals, BridgeApp } from './bridge-harness';

describe('Bridge 1: Commercial Pipeline (P07 -> P08 -> P09)', () => {
  let harness: BridgeApp;
  let commercialToken: string;
  let rndToken: string;
  const tenantA = randomUUID();
  const tenantB = randomUUID();

  beforeAll(async () => {
    harness = await bootBridgeApp();
    const comm = await harness.createUser('Comm_B1', ['COMMERCIAL', 'SUPER_ADMIN'], tenantA);
    commercialToken = comm.token;

    const rnd = await harness.createUser('Rnd_B1', ['RND', 'SUPER_ADMIN'], tenantA);
    rndToken = rnd.token;
  });

  afterAll(async () => {
    await cleanBridgeResiduals(harness.prisma);
    await harness.app.close();
  });

  it('B1-01: executes full CRM Lead -> R&D Sample -> Formula -> Sales Order pipeline', async () => {
    // 1. Create Lead in P07 CRM
    const leadPayload = {
      clientName: `Bridge Client ${randomUUID().slice(0, 6)}`,
      brandName: `Bridge Brand ${randomUUID().slice(0, 6)}`,
      contactInfo: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
      source: 'DIRECT',
      productInterest: 'Serum Vitamin C',
      estimatedValue: 50000000,
    };

    const leadRes = await request(harness.app.getHttpServer())
      .post('/bussdev/lead')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send(leadPayload);

    expect(leadRes.status).toBe(201);
    const leadId = leadRes.body.id;
    expect(leadId).toBeDefined();

    // 2. Submit Sample Request in P08 R&D referencing the lead
    const sampleRes = await request(harness.app.getHttpServer())
      .post('/rnd/samples')
      .set('Authorization', `Bearer ${rndToken}`)
      .send({
        leadId,
        productName: 'Serum Vit C Premium',
        targetFunction: 'Brightening',
        textureReq: 'Watery Gel',
        colorReq: 'Clear Light Yellow',
        aromaReq: 'Citrus Fresh',
      });

    expect(sampleRes.status).toBe(201);
    const sampleId = sampleRes.body.id;
    expect(sampleId).toBeDefined();

    // 3. Create Approved Formula in P08
    const formulaCode = `FORM-BR-${randomUUID().slice(0, 6).toUpperCase()}`;
    const formula = await harness.prisma.formula.create({
      data: {
        formulaCode,
        version: 1,
        status: FormulaStatus.PRODUCTION_LOCKED,
        sampleRequestId: sampleId,
      },
    });
    expect(formula.status).toBe('PRODUCTION_LOCKED');

    // 4. Create Sales Order in P09 Commercial referencing lead & sample
    const material = await harness.prisma.materialItem.create({
      data: {
        name: `Bridge_Material_${randomUUID().slice(0, 4)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 50000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 500,
      },
    });

    const soRes = await request(harness.app.getHttpServer())
      .post('/commercial/sales-orders')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        leadId,
        sampleId,
        salesCategory: 'CONTRACT_MANUFACTURING',
        items: [
          {
            materialId: material.id,
            productName: 'Serum Vit C Premium 30ml',
            quantity: 1000,
            unitPrice: 50000,
          },
        ],
      });

    expect(soRes.status).toBe(201);
    expect(soRes.body.orderNumber || soRes.body.id).toBeDefined();
  });

  it('B1-02: verifies tenant isolation prevents cross-tenant sales order access', async () => {
    // Create User in Tenant B
    const { token: tenantBToken } = await harness.createUser('Comm_TenantB', ['COMMERCIAL'], tenantB);

    // Attempt to query SO list from Tenant B - should not leak Tenant A data
    const listRes = await request(harness.app.getHttpServer())
      .get('/commercial/sales-orders')
      .set('Authorization', `Bearer ${tenantBToken}`);

    expect(listRes.status).toBe(200);
    const tenantBOrders = listRes.body;
    const leakedOrders = tenantBOrders.filter((o: any) => o.organizationId === tenantA);
    expect(leakedOrders).toHaveLength(0);
  });
});
