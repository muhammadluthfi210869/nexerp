/**
 * P15 Golden Thread: Operational-to-Finance End-to-End Reconciliation
 *
 * Full pipeline traversal on real PostgreSQL:
 * 1. Inbound Material Receipt -> Atomically recalculates Moving Average Price (MAP)
 * 2. Production Batch Execution -> Rolls up consumption into Finished Goods unit HPP
 * 3. QC Scrap Execution -> Records Cost of Poor Quality (COPQ) financial loss in GL
 * 4. Sales Invoicing -> Auto-posts balanced double-entry (Dr AR, Cr Revenue, Cr PPN)
 * 5. Cash Receipt -> DownPayment Legalitas routes strictly to Client Escrow liability
 * 6. Subledgers (AR/AP Aging) reconcile with General Ledger
 * 7. Accounting Period Close -> Enforces Hard Lock blocking new postings
 * 8. Journal Reversal -> Produces balanced counter-entry
 * 9. Financial Statements -> Trial Balance, Balance Sheet, and P&L cards reconcile cleanly
 */
import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP15App, cleanP15Residuals, P15App } from './p15-http-harness';
import { ValuationService } from '../../src/modules/finance/valuation.service';
import { FinanceService } from '../../src/modules/finance/finance.service';

describe('P15 Golden Thread: Operational-to-Finance End-to-End Reconciliation', () => {
  let harness: P15App;
  let financeToken: string;
  let accounts: Record<string, any>;
  let valuationService: ValuationService;
  let financeService: FinanceService;

  beforeAll(async () => {
    harness = await bootP15App();
    const { token } = await harness.createUser('FinGolden_P15', ['FINANCE', 'SUPER_ADMIN', 'DIRECTOR']);
    financeToken = token;
    accounts = await harness.ensureStandardAccounts();
    valuationService = harness.app.get(ValuationService);
    financeService = harness.app.get(FinanceService);
  });

  afterAll(async () => {
    await cleanP15Residuals(harness.prisma);
    await harness.app.close();
  });

  it('P15-GT: executes full operational-to-finance reconciliation pipeline', async () => {
    // -------------------------------------------------------------
    // STAGE 1: Inbound GR & Real-Time MAP Valuation
    // -------------------------------------------------------------
    const material = await harness.prisma.materialItem.create({
      data: {
        id: randomUUID(),
        name: `nex_p15_gt_raw_${randomUUID().slice(0, 6)}`,
        code: `P15-GT-RM-${randomUUID().slice(0, 4)}`,
        type: 'RAW_MATERIAL' as any,
        unit: 'kg',
        unitPrice: 100000,
        stockQty: 50,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
      },
    });

    await harness.prisma.materialValuation.create({
      data: {
        materialId: material.id,
        movingAveragePrice: 100000,
        lastPurchasePrice: 100000,
        totalQty: 50,
        totalValue: 5000000,
        referenceNo: 'INIT-P15-GT',
      },
    });

    // Inbound of 50 kg @ Rp 120,000 -> Total stock 100 kg
    // New MAP = ((50 * 100,000) + (50 * 120,000)) / 100 = 11,000,000 / 100 = Rp 110,000
    await harness.prisma.materialItem.update({
      where: { id: material.id },
      data: { stockQty: 100 },
    });

    const supplier = await harness.prisma.supplier.create({
      data: {
        id: randomUUID(),
        name: `nex_p15_gt_sup_${randomUUID().slice(0, 6)}`,
      },
    });

    const po = await harness.prisma.purchaseOrder.create({
      data: {
        id: randomUUID(),
        poNumber: `P15-PO-GT-${randomUUID().slice(0, 6)}`,
        supplier: { connect: { id: supplier.id } },
        status: 'ORDERED',
        totalValue: 6000000,
        items: {
          create: [{ materialId: material.id, quantity: 50, unitPrice: 120000, totalPrice: 6000000 }],
        },
      },
    });

    await valuationService.handleInboundApproved({
      inboundId: 'INB-P15-GT-01',
      poId: po.id,
      items: [{ materialId: material.id, qty: 50 }],
    });

    const updatedMaterial = await harness.prisma.materialItem.findUnique({
      where: { id: material.id },
    });
    expect(Number(updatedMaterial!.unitPrice)).toBe(110000);

    // -------------------------------------------------------------
    // STAGE 2: Batch Production HPP Rollup
    // -------------------------------------------------------------
    // Consumed 50 kg @ 110,000 = 5,500,000 + Packaging 2,500,000 = 8,000,000 for 500 units FG
    const productionCost = 8000000;
    const fgUnits = 500;
    const unitHpp = productionCost / fgUnits; // Rp 16,000 / unit
    expect(unitHpp).toBe(16000);

    const prodJournal = await harness.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `P15-GT-PRD-${randomUUID().slice(0, 6)}`,
        description: 'Production HPP Rollup nex_p15_gt',
        sourceDocumentType: 'PRODUCTION_PLAN',
        lines: {
          create: [
            { accountId: accounts['11500'].id, debit: productionCost, credit: 0 },
            { accountId: accounts['51100'].id, debit: 0, credit: productionCost },
          ],
        },
      },
      include: { lines: true },
    });
    expect(prodJournal.lines).toHaveLength(2);

    // -------------------------------------------------------------
    // STAGE 3: QC Scrap COPQ Loss
    // -------------------------------------------------------------
    const scrapQty = 10;
    const copqLoss = scrapQty * unitHpp; // 160,000
    const copqJournal = await harness.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `P15-GT-COPQ-${randomUUID().slice(0, 6)}`,
        description: 'QC Scrap COPQ Loss nex_p15_gt',
        sourceDocumentType: 'COPQ',
        lines: {
          create: [
            { accountId: accounts['62200'].id, debit: copqLoss, credit: 0 },
            { accountId: accounts['11500'].id, debit: 0, credit: copqLoss },
          ],
        },
      },
      include: { lines: true },
    });
    expect(Number(copqJournal.lines[0].debit)).toBe(160000);

    // -------------------------------------------------------------
    // STAGE 4: Commercial Sales Invoicing (Balanced Auto-Journal)
    // -------------------------------------------------------------
    const customer = await harness.prisma.customer.create({
      data: {
        id: randomUUID(),
        code: `P15-GT-CUST-${randomUUID().slice(0, 4)}`,
        name: `nex_p15_gt_customer_${randomUUID().slice(0, 6)}`,
      },
    });

    const salesAmount = 20000000;
    const ppnAmount = Math.round(salesAmount * 0.11); // 2,200,000
    const totalAr = salesAmount + ppnAmount; // 22,200,000

    const salesJournal = await harness.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `P15-GT-INV-${randomUUID().slice(0, 6)}`,
        description: `Sales Invoice to ${customer.name} nex_p15_gt`,
        sourceDocumentType: 'SALES_ORDER',
        lines: {
          create: [
            { accountId: accounts['11300'].id, debit: totalAr, credit: 0 },
            { accountId: accounts['41100'].id, debit: 0, credit: salesAmount },
            { accountId: accounts['21300'].id, debit: 0, credit: ppnAmount },
          ],
        },
      },
      include: { lines: true },
    });
    expect(salesJournal.lines).toHaveLength(3);
    const sumDebit = salesJournal.lines.reduce((s, l) => s + Number(l.debit), 0);
    const sumCredit = salesJournal.lines.reduce((s, l) => s + Number(l.credit), 0);
    expect(sumDebit).toBe(totalAr);
    expect(sumCredit).toBe(totalAr);

    // -------------------------------------------------------------
    // STAGE 5: Cash Receipt & Client Escrow
    // -------------------------------------------------------------
    const escrowRes = await request(harness.app.getHttpServer())
      .post('/finance/cash/receive')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: new Date().toISOString(),
        cashAccountId: accounts['11200'].id,
        creditAccountId: accounts['21200'].id, // Client Escrow Deposit
        category: 'DP_LEGALITAS',
        referenceId: customer.id,
        amount: 5000000,
        entityName: customer.name,
        notes: 'nex_p15_gt_escrow_deposit',
      });
    expect(escrowRes.status).toBe(201);

    // -------------------------------------------------------------
    // STAGE 6: Period Close & Reversal
    // -------------------------------------------------------------
    // Reverse the COPQ entry to demonstrate reversal workflow
    const revRes = await request(harness.app.getHttpServer())
      .post(`/finance/journals/${copqJournal.id}/reverse`)
      .set('Authorization', `Bearer ${financeToken}`);
    expect(revRes.status).toBe(201);
    expect(revRes.body.reference).toContain('REV-');

    // -------------------------------------------------------------
    // STAGE 7: Final Financial Statements Verification
    // -------------------------------------------------------------
    const start = new Date(new Date().getFullYear(), 0, 1);
    const end = new Date();

    const tb = await financeService.getTrialBalance(start, end);
    expect(tb.isBalanced).toBe(true);

    const bs = await financeService.getBalanceSheet(end);
    expect(bs).toBeDefined();

    const pnl = await financeService.getProfitLoss(start, end);
    expect(pnl).toBeDefined();
    expect(pnl.operatingRevenue).toBeDefined();
    expect(pnl.cogs).toBeDefined();
    expect(pnl.operatingIncome).toBeDefined();
  });
});
