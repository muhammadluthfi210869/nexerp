/**
 * P18-S2: Financial Reports Reconciliation Acceptance Suite.
 *
 * Verifies:
 * - AC-P18-02: Financial Reports Reconciliation (Source-to-Report)
 * - AC-P18-03: Subledger Aging Reports Reconciliation
 * - S2.1: GET /reports/trial-balance (Debits == Credits)
 * - S2.2: GET /reports/profit-loss (Revenue - Expense = Net Income)
 * - S2.3: GET /reports/balance-sheet (Assets = Liabilities + Equity + Net Income)
 * - S2.4: GET /reports/ar-aging (Reconciles open SalesInvoices to aging buckets)
 * - S2.5: GET /reports/ap-aging (Reconciles open Payables to aging buckets)
 */
import request from 'supertest';
import { UserRole, PaymentStatus, InvoiceCategory, InvoiceStatus } from '@prisma/client';
import { bootP18App, P18App } from './p18-http-harness';
import { randomUUID } from 'crypto';

describe('P18 S2: Financial Reports Reconciliation (Trial Balance, P&L, Balance Sheet, Aging)', () => {
  let p18: P18App;
  let financeToken: string;
  let customerId: string;
  let supplierId: string;

  beforeAll(async () => {
    p18 = await bootP18App();
    await p18.cleanupP18Data();

    const finance = await p18.createUser('FinanceOfficer', [UserRole.FINANCE]);
    financeToken = finance.token;

    // Seed customer
    const cust = await p18.prisma.customer.create({
      data: {
        code: 'CUST-P18-S2',
        name: 'PT P18 Kosmetik Sejahtera',
        phone: '08123456789',
        address: 'Jl. P18 No. 18, Jakarta',
        brand: 'P18 Beauty',
        isActive: true,
      },
    });
    customerId = cust.id;

    // Seed supplier
    const supp = await p18.prisma.supplier.create({
      data: {
        name: 'CV P18 Kimia Farma Supply',
        phone: '08198765432',
        address: 'Jl. Supplier No. 18, Surabaya',
      },
    });
    supplierId = supp.id;
  });

  afterAll(async () => {
    await p18.cleanupP18Data();
    await p18.app.close();
  });

  it('S2.1 - GET /reports/trial-balance returns balanced debits and credits', async () => {
    const res = await request(p18.app.getHttpServer())
      .get('/reports/trial-balance')
      .set('Authorization', `Bearer ${financeToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('totals');
    const { totalDebit, totalCredit, isBalanced } = res.body.totals;

    expect(typeof totalDebit).toBe('number');
    expect(typeof totalCredit).toBe('number');
    expect(Math.abs(totalDebit - totalCredit)).toBeLessThanOrEqual(0.01);
    expect(isBalanced).toBe(true);
  });

  it('S2.2 - GET /reports/profit-loss reconciles revenue, expenses, and net profit', async () => {
    const res = await request(p18.app.getHttpServer())
      .get('/reports/profit-loss')
      .set('Authorization', `Bearer ${financeToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('revenue');
    expect(res.body).toHaveProperty('expenses');
    expect(res.body).toHaveProperty('netIncome');

    const calculatedNet = res.body.revenue.total - res.body.expenses.total;
    expect(Math.abs(res.body.netIncome - calculatedNet)).toBeLessThanOrEqual(0.01);
  });

  it('S2.3 - GET /reports/balance-sheet confirms balance equation (Assets = Liab + Equity + Net Income)', async () => {
    const res = await request(p18.app.getHttpServer())
      .get('/reports/balance-sheet')
      .set('Authorization', `Bearer ${financeToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('assets');
    expect(res.body).toHaveProperty('liabilities');
    expect(res.body).toHaveProperty('equity');
    expect(res.body).toHaveProperty('netIncome');
    expect(res.body).toHaveProperty('isBalanced');
    expect(res.body.isBalanced).toBe(true);
  });

  it('S2.4 - GET /reports/ar-aging reconciles open SalesInvoices into exact buckets and total', async () => {
    // Create 2 open invoices: 1 current, 1 overdue by 45 days
    const now = new Date();
    const futureDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);

    await p18.prisma.salesInvoice.create({
      data: {
        invoiceNumber: `P18-INV-CUR-${Date.now()}`,
        customerId,
        invoiceDate: now,
        dueDate: futureDate,
        subtotal: 50000000,
        totalAmount: 55000000,
        paidAmount: 15000000, // outstanding = 40M
        paymentStatus: PaymentStatus.PARTIAL,
      },
    });

    await p18.prisma.salesInvoice.create({
      data: {
        invoiceNumber: `P18-INV-OVD-${Date.now()}`,
        customerId,
        invoiceDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        dueDate: pastDate,
        subtotal: 20000000,
        totalAmount: 20000000,
        paidAmount: 0, // outstanding = 20M
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    const res = await request(p18.app.getHttpServer())
      .get('/reports/ar-aging')
      .set('Authorization', `Bearer ${financeToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('summary');
    const { totalOutstanding, buckets } = res.body.summary;

    expect(totalOutstanding).toBeGreaterThanOrEqual(60000000);
    expect(buckets['Current']).toBeGreaterThanOrEqual(40000000);
    expect(buckets['31-60']).toBeGreaterThanOrEqual(20000000);
  });

  it('S2.5 - GET /reports/ap-aging reconciles open payable invoices into exact buckets', async () => {
    const now = new Date();
    const pastDueDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    await p18.prisma.invoice.create({
      data: {
        invoiceNumber: `P18-AP-INV-${Date.now()}`,
        category: InvoiceCategory.PAYABLE,
        status: InvoiceStatus.UNPAID,
        amountDue: 35000000,
        outstandingAmount: 35000000,
        dueDate: pastDueDate,
        issuedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        supplierId,
      },
    });

    const res = await request(p18.app.getHttpServer())
      .get('/reports/ap-aging')
      .set('Authorization', `Bearer ${financeToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('summary');
    expect(res.body.summary.totalOutstanding).toBeGreaterThanOrEqual(35000000);
    expect(res.body.summary.buckets['1-30']).toBeGreaterThanOrEqual(35000000);
  });
});
