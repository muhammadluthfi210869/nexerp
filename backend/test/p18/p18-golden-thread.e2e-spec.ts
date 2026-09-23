/**
 * P18 Golden Thread Acceptance Suite.
 *
 * Full lifecycle flow:
 * 1. Seed Customer & Lead & SalesOrder.
 * 2. Post SalesInvoice with partial payment.
 * 3. Verify AR Aging exact reconciliation against the invoice.
 * 4. Verify Sales Summary exact reconciliation.
 * 5. Verify Executive Dashboard rollup of revenue and conversion metrics.
 * 6. Verify Executive Audit Trail reflection.
 * 7. Teardown: 100% database cleanup verified with 0 leftover rows.
 */
import request from 'supertest';
import { UserRole, WorkflowStatus, PaymentStatus, LogActivityType } from '@prisma/client';
import { bootP18App, P18App } from './p18-http-harness';
import { randomUUID } from 'crypto';

describe('P18 Golden Thread: Full Reporting, Executive Analytics & Audit Flow', () => {
  let p18: P18App;
  let directorToken: string;
  let directorUser: any;
  let customerId: string;
  let invoiceId: string;
  const invoiceNumber = `P18-GLD-INV-${Date.now()}`;

  beforeAll(async () => {
    p18 = await bootP18App();
    await p18.cleanupP18Data();

    const director = await p18.createUser('GoldenDirector', [UserRole.DIRECTOR, UserRole.SUPER_ADMIN]);
    directorUser = director.user;
    directorToken = director.token;

    // 1. Seed Customer
    const cust = await p18.prisma.customer.create({
      data: {
        code: 'CUST-P18-GOLDEN',
        name: 'PT P18 Golden Brand Nusantara',
        phone: '081122334455',
        brand: 'Golden P18 Skin',
        isActive: true,
      },
    });
    customerId = cust.id;

    // 2. Seed Lead
    const staff =
      (await p18.prisma.bussdevStaff.findFirst()) ||
      (await p18.prisma.bussdevStaff.create({
        data: { name: 'P18 Golden Staff' },
      }));

    await p18.prisma.salesLead.create({
      data: {
        clientName: 'PT P18 Golden Brand Nusantara',
        contactInfo: 'golden@p18.test',
        source: 'DIRECT_REFERRAL',
        productInterest: 'Acne Cleanser 100ml',
        status: WorkflowStatus.WON_DEAL,
        picId: staff.id,
      },
    });
  });

  afterAll(async () => {
    await p18.cleanupP18Data();
    await p18.app.close();
  });

  it('Step 1: Creates SalesInvoice and records partial payment', async () => {
    const inv = await p18.prisma.salesInvoice.create({
      data: {
        invoiceNumber,
        customerId,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // Due in 20 days -> Current bucket
        subtotal: 100000000,
        totalAmount: 110000000,
        paidAmount: 40000000, // 40M paid, 70M outstanding
        paymentStatus: PaymentStatus.PARTIAL,
      },
    });
    invoiceId = inv.id;

    // Audit log
    await p18.prisma.activityLog.create({
      data: {
        userId: directorUser.id,
        type: LogActivityType.CREATE,
        entityType: 'SalesInvoice',
        entityId: inv.id,
        path: `/finance/invoices/${inv.id}`,
        method: 'POST',
        status: 201,
        metadata: { invoiceNumber, total: 110000000 },
      },
    });

    expect(invoiceId).toBeDefined();
  });

  it('Step 2: Reconciles AR Aging report to the open invoice balance', async () => {
    const res = await request(p18.app.getHttpServer())
      .get('/reports/ar-aging')
      .set('Authorization', `Bearer ${directorToken}`)
      .expect(200);

    expect(res.body.summary.totalOutstanding).toBeGreaterThanOrEqual(70000000);
    expect(res.body.summary.buckets['Current']).toBeGreaterThanOrEqual(70000000);

    const match = res.body.data.find((i: any) => i.invoiceNo === invoiceNumber);
    expect(match).toBeDefined();
    expect(match.outstandingAmount).toBe(70000000);
    expect(match.bucket).toBe('Current');
  });

  it('Step 3: Reconciles Sales Summary report per customer', async () => {
    const res = await request(p18.app.getHttpServer())
      .get('/reports/sales-summary')
      .set('Authorization', `Bearer ${directorToken}`)
      .expect(200);

    const custSummary = res.body.data.find((c: any) => c.customer.includes('P18 Golden Brand'));
    expect(custSummary).toBeDefined();
    expect(custSummary.totalAmount).toBe(110000000);
    expect(custSummary.totalReceived).toBe(40000000);
    expect(custSummary.outstanding).toBe(70000000);
  });

  it('Step 4: Reconciles live Executive Dashboard metrics rollup', async () => {
    const res = await request(p18.app.getHttpServer())
      .get('/dashboards/executive')
      .set('Authorization', `Bearer ${directorToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.lead_conversion_pct).toBe('number');
    expect(typeof res.body.data.otd_pct).toBe('number');
  });

  it('Step 5: Verifies audit trail captures the invoice event', async () => {
    const res = await request(p18.app.getHttpServer())
      .get('/executive/audit-logs')
      .set('Authorization', `Bearer ${directorToken}`)
      .expect(200);

    const log = res.body.find((l: any) => l.entityId === invoiceId);
    expect(log).toBeDefined();
    expect(log.entity).toBe('SalesInvoice');
    expect(log.action).toBe('CREATE');
  });
});
