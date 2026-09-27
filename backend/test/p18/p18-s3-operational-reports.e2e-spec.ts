/**
 * P18-S3: Operational Reports Acceptance Suite.
 *
 * Verifies:
 * - AC-P18-04: Operational Reports (Sales Summary & Stock Valuation)
 * - S3.1: GET /reports/sales-summary (Aggregates orders, amounts, and payments per customer)
 * - S3.2: GET /reports/sales-summary (Filtering by customerId)
 * - S3.3: GET /reports/stock-valuation (Calculates stock value = currentStock * unitCost)
 * - S3.4: GET /reports/stock-valuation (Warehouse filter scoping)
 */
import request from 'supertest';
import { UserRole, MaterialType, QCStatus, PaymentStatus } from '@prisma/client';
import { bootP18App, P18App } from './p18-http-harness';
import { randomUUID } from 'crypto';

describe('P18 S3: Operational Reports (Sales Summary & Stock Valuation)', () => {
  let p18: P18App;
  let adminToken: string;
  let customerId: string;
  let warehouseId: string;
  let materialId: string;
  let supplierId: string;

  beforeAll(async () => {
    p18 = await bootP18App();
    await p18.cleanupP18Data();

    const admin = await p18.createUser('OperationalAdmin', [UserRole.SUPER_ADMIN]);
    adminToken = admin.token;

    // Seed customer
    const cust = await p18.prisma.customer.create({
      data: {
        code: 'CUST-P18-OPS',
        name: 'PT P18 Operational Client',
        phone: '081299998888',
        brand: 'P18 Ops Brand',
        isActive: true,
      },
    });
    customerId = cust.id;

    // Seed warehouse & location
    const wh = await p18.prisma.warehouse.findFirst();
    warehouseId = wh?.id || (await p18.prisma.warehouse.create({
      data: { name: 'P18 Central Warehouse', address: 'Kawasan Industri P18' },
    })).id;

    const loc = await p18.prisma.warehouseLocation.findFirst({ where: { warehouseId } });
    const locationId = loc?.id || (await p18.prisma.warehouseLocation.create({
      data: { name: 'Rack P18-A', capacity: 1000, warehouseId },
    })).id;

    // Seed material
    const mat = await p18.prisma.materialItem.create({
      data: {
        name: 'P18 Niacinamide Raw 99%',
        type: MaterialType.RAW_MATERIAL,
        unit: 'KG',
        unitPrice: 250000,
        minLevel: 0,
        maxLevel: 1000,
        reorderPoint: 10,
        autoCalculatedHpp: 250000, // 250k per KG
      },
    });
    materialId = mat.id;

    const supp = await p18.prisma.supplier.findFirst();
    supplierId = supp?.id || (await p18.prisma.supplier.create({
      data: { name: 'P18 Raw Chemical Supplier' },
    })).id;

    // Seed inventory
    await p18.prisma.materialInventory.create({
      data: {
        materialId,
        supplierId,
        batchNumber: `P18-LOT-${Date.now()}`,
        currentStock: 100, // 100 KG -> value = 25,000,000
        locationId,
        qcStatus: QCStatus.GOOD,
      },
    });

    // Seed sales invoice
    await p18.prisma.salesInvoice.create({
      data: {
        invoiceNumber: `P18-SO-INV-${Date.now()}`,
        customerId,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        subtotal: 100000000,
        totalAmount: 110000000,
        paidAmount: 60000000,
        paymentStatus: PaymentStatus.PARTIAL,
      },
    });
  });

  afterAll(async () => {
    await p18.cleanupP18Data();
    await p18.app.close();
  });

  it('S3.1 - GET /reports/sales-summary aggregates orders, paid, and outstanding by customer', async () => {
    const res = await request(p18.app.getHttpServer())
      .get('/reports/sales-summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('summary');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.summary.totalAmount).toBeGreaterThanOrEqual(110000000);
    expect(res.body.summary.totalReceived).toBeGreaterThanOrEqual(60000000);
    expect(res.body.summary.totalOutstanding).toBeGreaterThanOrEqual(50000000);
  });

  it('S3.2 - GET /reports/sales-summary filters accurately by customerId', async () => {
    const res = await request(p18.app.getHttpServer())
      .get(`/reports/sales-summary?customerId=${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const target = res.body.data.find((c: any) => c.customer.includes('P18 Operational Client'));
    expect(target).toBeDefined();
    expect(target.totalAmount).toBe(110000000);
    expect(target.totalReceived).toBe(60000000);
    expect(target.outstanding).toBe(50000000);
  });

  it('S3.3 - GET /reports/stock-valuation computes item total value = stock * unitCost', async () => {
    const res = await request(p18.app.getHttpServer())
      .get('/reports/stock-valuation')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('summary');
    expect(res.body.summary.totalStockValue).toBeGreaterThanOrEqual(25000000);

    const item = res.body.data.find((i: any) => i.materialName.includes('P18 Niacinamide'));
    expect(item).toBeDefined();
    expect(item.currentStock).toBe(100);
    expect(item.unitCost).toBe(250000);
    expect(item.totalValue).toBe(25000000);
  });

  it('S3.4 - GET /reports/stock-valuation scopes correctly by warehouseId', async () => {
    const res = await request(p18.app.getHttpServer())
      .get(`/reports/stock-valuation?warehouseId=${warehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.summary.totalStockValue).toBeGreaterThanOrEqual(25000000);
  });
});
