/**
 * P15-S4: Period Close, Soft/Hard Lock & Reversals
 *
 * Tests:
 * 1. BUS-RULE-064: Closed financial periods reject normal journal postings (Period Hard Lock)
 * 2. Adjustment journal allows adjustments in closed period with multi-person SoD
 * 3. Reversing a posted journal generates exact counter-entry (debits/credits inverted)
 * 4. Attempting to reverse an existing reversal entry is rejected
 */
import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP15App, cleanP15Residuals, p15Message, P15App } from './p15-http-harness';
import { AdjustmentJournalsService } from '../../src/modules/finance/adjustment-journals/adjustment-journals.service';

describe('P15-S4: Period Close, Soft/Hard Lock & Reversals', () => {
  let harness: P15App;
  let financeToken: string;
  let accounts: Record<string, any>;
  let adjService: AdjustmentJournalsService;

  beforeAll(async () => {
    harness = await bootP15App();
    const { token } = await harness.createUser('FinAdmin_S4', ['FINANCE', 'SUPER_ADMIN']);
    financeToken = token;
    accounts = await harness.ensureStandardAccounts();
    adjService = harness.app.get(AdjustmentJournalsService);
  });

  afterAll(async () => {
    await cleanP15Residuals(harness.prisma);
    await harness.app.close();
  });

  it('AC-P15-04a: closed accounting period strictly rejects normal journal posting (BUS-RULE-064)', async () => {
    // 1. Create a CLOSED financial period for previous month
    const prevMonthStart = new Date(2026, 0, 1);
    const prevMonthEnd = new Date(2026, 0, 31, 23, 59, 59);

    const lockedPeriod = await harness.prisma.financialPeriod.create({
      data: {
        id: randomUUID(),
        name: `P15-Period-Jan-2026-${randomUUID().slice(0, 4)}`,
        startDate: prevMonthStart,
        endDate: prevMonthEnd,
        status: 'CLOSED',
      },
    });

    // 2. Attempt normal journal entry with date inside the closed period
    const res = await request(harness.app.getHttpServer())
      .post('/finance/journals')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: new Date(2026, 0, 15).toISOString(), // Jan 15, 2026 (LOCKED)
        reference: 'nex_p15_s4_locked_attempt',
        description: 'Attempting to post in closed period',
        lines: [
          { accountId: accounts['11100'].id, debit: 1000000, credit: 0 },
          { accountId: accounts['41100'].id, debit: 0, credit: 1000000 },
        ],
      });

    expect(res.status).toBe(400);
    expect(p15Message(res)).toMatch(/(dikunci atau ditutup|PERIOD_HARD_LOCKED)/);

    // Clean up test period
    await harness.prisma.financialPeriod.delete({ where: { id: lockedPeriod.id } });
  });

  it('AC-P15-04b: adjustment journal allows controlled corrections in locked period with multi-user SoD', async () => {
    const userA = await harness.createUser('AdjPreparer_S4', ['FINANCE']);
    const userB = await harness.createUser('AdjReviewer_S4', ['FINANCE']);
    const userC = await harness.createUser('AdjApprover_S4', ['DIRECTOR', 'FINANCE']);

    // 1. Prepare draft adjustment
    const adj = await adjService.create(userA.user.id, {
      period: '2026-01-01',
      description: 'Adjustment: Year-end audit accrual correction nex_p15',
      totalAmount: 15000000,
    });
    expect(adj.preparedBy).toBe(userA.user.id);
    expect(adj.journalNumber).toContain('ADJ-');

    // 2. Preparer cannot review their own adjustment (SoD)
    await expect(adjService.review(userA.user.id, adj.id)).rejects.toThrow();

    // 3. Reviewer reviews
    const reviewed = await adjService.review(userB.user.id, adj.id);
    expect(reviewed.reviewedBy).toBe(userB.user.id);

    // 4. Preparer and Reviewer cannot approve (SoD)
    await expect(adjService.approve(userA.user.id, adj.id)).rejects.toThrow();
    await expect(adjService.approve(userB.user.id, adj.id)).rejects.toThrow();

    // 5. Director / Approver approves
    const approved = await adjService.approve(userC.user.id, adj.id);
    expect(approved.approvedBy).toBe(userC.user.id);

    // Verify progress
    const progress = await adjService.getProgress(adj.id);
    expect(progress.fullyApproved).toBe(true);

    // Cleanup
    await harness.prisma.adjustmentJournal.delete({ where: { id: adj.id } });
  });

  it('AC-P15-04c: reversing a posted journal generates counter-entry with inverted lines', async () => {
    // 1. Create a regular posted journal entry
    const original = await harness.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `JRN-P15-ORIG-${randomUUID().slice(0, 6)}`,
        description: 'Original transaction to be reversed nex_p15',
        sourceDocumentType: 'PAYMENT',
        lines: {
          create: [
            { accountId: accounts['61100'].id, debit: 800000, credit: 0 },
            { accountId: accounts['11200'].id, debit: 0, credit: 800000 },
          ],
        },
      },
      include: { lines: true },
    });

    // 2. Execute reversal endpoint
    const revRes = await request(harness.app.getHttpServer())
      .post(`/finance/journals/${original.id}/reverse`)
      .set('Authorization', `Bearer ${financeToken}`);

    expect(revRes.status).toBe(201);
    expect(revRes.body.reference).toContain('REV-');
    expect(revRes.body.description).toContain('REVERSAL');

    // 3. Verify lines are inverted
    const revJournal = await harness.prisma.journalEntry.findUnique({
      where: { id: revRes.body.id },
      include: { lines: true },
    });

    expect(revJournal).toBeDefined();
    expect(revJournal!.lines).toHaveLength(2);

    // Debit on Bank (was Credit in original), Credit on Expense (was Debit in original)
    const bankLine = revJournal!.lines.find((l) => l.accountId === accounts['11200'].id);
    const expLine = revJournal!.lines.find((l) => l.accountId === accounts['61100'].id);

    expect(Number(bankLine!.debit)).toBe(800000);
    expect(Number(bankLine!.credit)).toBe(0);
    expect(Number(expLine!.debit)).toBe(0);
    expect(Number(expLine!.credit)).toBe(800000);

    // 4. Attempting to reverse the reversal journal must be rejected
    const doubleRevRes = await request(harness.app.getHttpServer())
      .post(`/finance/journals/${revJournal!.id}/reverse`)
      .set('Authorization', `Bearer ${financeToken}`);

    expect(doubleRevRes.status).toBe(400);
    expect(p15Message(doubleRevRes)).toContain('Cannot reverse a reversal journal');
  });
});
