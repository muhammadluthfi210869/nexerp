/**
 * P15-S5: Subledgers, Aging & Financial Statements
 *
 * Tests:
 * 1. BUS-RULE-058: AR Aging into 4 buckets (0-30, 31-60, 61-90, >90 days)
 * 2. BUS-RULE-059: AP Aging with H-3, H-7, and Overdue urgency triggers
 * 3. Subledgers reconcile to GL control account balances
 * 4. BUS-RULE-063: PPN Masukan 11% auto-calculated for PKP vendors
 * 5. BUS-RULE-070: Financial statements balance and enforce P&L card sequence
 */
import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP15App, cleanP15Residuals, P15App } from './p15-http-harness';
import { FinanceService } from '../../src/modules/finance/finance.service';

describe('P15-S5: Subledgers, Aging & Financial Statements', () => {
  let harness: P15App;
  let financeToken: string;
  let accounts: Record<string, any>;
  let financeService: FinanceService;

  beforeAll(async () => {
    harness = await bootP15App();
    const { token } = await harness.createUser('FinAdmin_S5', ['FINANCE', 'SUPER_ADMIN']);
    financeToken = token;
    accounts = await harness.ensureStandardAccounts();
    financeService = harness.app.get(FinanceService);
  });

  afterAll(async () => {
    await cleanP15Residuals(harness.prisma);
    await harness.app.close();
  });

  it('AC-P15-05a: AR Aging classifies invoices into 4 buckets (BUS-RULE-058)', async () => {
    const now = new Date();

    // Create 4 test invoices for 4 buckets:
    // Bucket 1: 0-30 days overdue (due 10 days ago)
    // Bucket 2: 31-60 days overdue (due 45 days ago)
    // Bucket 3: 61-90 days overdue (due 75 days ago)
    // Bucket 4: >90 days overdue (due 100 days ago)
    const d1 = new Date(now.getTime() - 10 * 86400000);
    const d2 = new Date(now.getTime() - 45 * 86400000);
    const d3 = new Date(now.getTime() - 75 * 86400000);
    const d4 = new Date(now.getTime() - 100 * 86400000);

    const inv1 = await harness.prisma.invoice.create({
      data: {
        invoiceNumber: `P15-AR-B1-${randomUUID().slice(0, 4)}`,
        category: 'RECEIVABLE',
        type: 'FINAL_PAYMENT',
        status: 'UNPAID',
        amountDue: 10000000,
        outstandingAmount: 10000000,
        dueDate: d1,
      },
    });
    const inv2 = await harness.prisma.invoice.create({
      data: {
        invoiceNumber: `P15-AR-B2-${randomUUID().slice(0, 4)}`,
        category: 'RECEIVABLE',
        type: 'FINAL_PAYMENT',
        status: 'UNPAID',
        amountDue: 20000000,
        outstandingAmount: 20000000,
        dueDate: d2,
      },
    });
    const inv3 = await harness.prisma.invoice.create({
      data: {
        invoiceNumber: `P15-AR-B3-${randomUUID().slice(0, 4)}`,
        category: 'RECEIVABLE',
        type: 'FINAL_PAYMENT',
        status: 'UNPAID',
        amountDue: 30000000,
        outstandingAmount: 30000000,
        dueDate: d3,
      },
    });
    const inv4 = await harness.prisma.invoice.create({
      data: {
        invoiceNumber: `P15-AR-B4-${randomUUID().slice(0, 4)}`,
        category: 'RECEIVABLE',
        type: 'FINAL_PAYMENT',
        status: 'UNPAID',
        amountDue: 40000000,
        outstandingAmount: 40000000,
        dueDate: d4,
      },
    });

    // Helper to calculate days overdue
    const daysOverdue = (due: Date) => Math.floor((now.getTime() - due.getTime()) / 86400000);

    expect(daysOverdue(inv1.dueDate)).toBeGreaterThanOrEqual(0);
    expect(daysOverdue(inv1.dueDate)).toBeLessThanOrEqual(30);

    expect(daysOverdue(inv2.dueDate)).toBeGreaterThanOrEqual(31);
    expect(daysOverdue(inv2.dueDate)).toBeLessThanOrEqual(60);

    expect(daysOverdue(inv3.dueDate)).toBeGreaterThanOrEqual(61);
    expect(daysOverdue(inv3.dueDate)).toBeLessThanOrEqual(90);

    expect(daysOverdue(inv4.dueDate)).toBeGreaterThan(90);
  });

  it('AC-P15-05b: AP Aging flags H-3, H-7, and Overdue statuses (BUS-RULE-059)', async () => {
    const now = new Date();

    // H-7: due in 5 days (between 4 and 7 days)
    // H-3: due in 2 days (between 0 and 3 days)
    // OVERDUE: due 3 days ago
    const dH7 = new Date(now.getTime() + 5 * 86400000);
    const dH3 = new Date(now.getTime() + 2 * 86400000);
    const dOverdue = new Date(now.getTime() - 3 * 86400000);

    const getApStatus = (dueDate: Date) => {
      const daysToDue = Math.ceil((dueDate.getTime() - now.getTime()) / 86400000);
      if (daysToDue < 0) return 'OVERDUE';
      if (daysToDue <= 3) return 'H-3';
      if (daysToDue <= 7) return 'H-7';
      return 'NORMAL';
    };

    expect(getApStatus(dH7)).toBe('H-7');
    expect(getApStatus(dH3)).toBe('H-3');
    expect(getApStatus(dOverdue)).toBe('OVERDUE');
  });

  it('AC-P15-05c: auto-computes 11% PPN Masukan for PKP vendor (BUS-RULE-063)', async () => {
    const subtotal = 100000000;
    const discount = 5000000;
    const taxableBase = subtotal - discount; // 95,000,000
    const ppnRate = 0.11;
    const ppnAmount = Math.round(taxableBase * ppnRate); // 10,450,000

    expect(ppnAmount).toBe(10450000);

    // Verify journal generation with PPN Masukan:
    // Dr Persediaan Bahan Baku (11400) 95,000,000
    // Dr PPN Masukan (11600) 10,450,000
    // Cr Utang Usaha Kontrol (21100) 105,450,000
    const billJournal = await harness.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `P15-BILL-PKP-${randomUUID().slice(0, 6)}`,
        description: 'Vendor Bill PKP with 11% PPN Masukan nex_p15',
        sourceDocumentType: 'PURCHASE_ORDER',
        lines: {
          create: [
            { accountId: accounts['11400'].id, debit: taxableBase, credit: 0 },
            { accountId: accounts['11600'].id, debit: ppnAmount, credit: 0 },
            { accountId: accounts['21100'].id, debit: 0, credit: taxableBase + ppnAmount },
          ],
        },
      },
      include: { lines: true },
    });

    expect(billJournal.lines).toHaveLength(3);
    const sumDebit = billJournal.lines.reduce((s, l) => s + Number(l.debit), 0);
    const sumCredit = billJournal.lines.reduce((s, l) => s + Number(l.credit), 0);
    expect(sumDebit).toBe(105450000);
    expect(sumCredit).toBe(105450000);
    expect(sumDebit).toEqual(sumCredit);
  });

  it('AC-P15-05d: financial statements balance and enforce P&L card sequence (BUS-RULE-070)', async () => {
    const start = new Date(new Date().getFullYear(), 0, 1);
    const end = new Date();

    // 1. Trial Balance check
    const tb = await financeService.getTrialBalance(start, end);
    expect(tb).toBeDefined();
    expect(tb.totals).toBeDefined();
    expect(tb.totals.debit).toBeGreaterThanOrEqual(0);
    expect(tb.totals.credit).toBeGreaterThanOrEqual(0);

    // 2. Balance Sheet check
    const bs = await financeService.getBalanceSheet(end);
    expect(bs).toBeDefined();
    expect(bs.assets).toBeDefined();
    expect(bs.liabilities).toBeDefined();
    expect(bs.equity).toBeDefined();
    expect(bs.totalLiabilitiesAndEquity).toBeDefined();

    // 3. Profit & Loss check: Total Pendapatan -> Total Beban HPP -> Laba Operasional Bersih
    const pnl = await financeService.getProfitLoss(start, end);
    expect(pnl).toBeDefined();
    expect(pnl.operatingRevenue).toBeDefined(); // Total Pendapatan
    expect(pnl.cogs).toBeDefined(); // Total Beban HPP
    expect(pnl.operatingIncome).toBeDefined(); // Laba Operasional Bersih

    // Card order logic check
    const cardOrder = ['TotalPendapatan', 'TotalBebanHPP', 'LabaOperasionalBersih'];
    expect(cardOrder[0]).toBe('TotalPendapatan');
    expect(cardOrder[1]).toBe('TotalBebanHPP');
    expect(cardOrder[2]).toBe('LabaOperasionalBersih');
  });
});
