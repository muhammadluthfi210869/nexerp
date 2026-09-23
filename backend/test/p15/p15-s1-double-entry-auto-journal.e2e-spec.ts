/**
 * P15-S1: Double-Entry Core Invariant & Auto-Journal Protection
 *
 * Tests:
 * 1. BUS-RULE-056: Reject unbalanced journal entries (sum(debit) != sum(credit))
 * 2. BUS-RULE-068: Reject manual journals targeting control accounts (allowManualJournal = false)
 * 3. Successful balanced manual journal creation
 * 4. Operational auto-journal posting with exact double-entry balance
 */
import request from 'supertest';
import { bootP15App, cleanP15Residuals, P15App, p15Message } from './p15-http-harness';

describe('P15-S1: Double-Entry Core & Auto-Journal Protection', () => {
  let harness: P15App;
  let financeToken: string;
  let accounts: Record<string, any>;

  beforeAll(async () => {
    harness = await bootP15App();
    const { token } = await harness.createUser('FinAdmin_S1', ['FINANCE', 'SUPER_ADMIN']);
    financeToken = token;
    accounts = await harness.ensureStandardAccounts();
  });

  afterAll(async () => {
    await cleanP15Residuals(harness.prisma);
    await harness.app.close();
  });

  it('AC-P15-01a: strictly rejects unbalanced manual journal entry (BUS-RULE-056)', async () => {
    const res = await request(harness.app.getHttpServer())
      .post('/finance/journals')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: new Date().toISOString(),
        reference: 'nex_p15_s1_unbalanced',
        description: 'Unbalanced P15 test journal',
        lines: [
          { accountId: accounts['11100'].id, debit: 500000, credit: 0 },
          { accountId: accounts['41100'].id, debit: 0, credit: 450000 }, // Discrepancy of 50,000!
        ],
      });

    expect(res.status).toBe(400);
    expect(p15Message(res)).toContain('JOURNAL_UNBALANCED');
  });

  it('AC-P15-01b: strictly rejects manual journal on control accounts (BUS-RULE-068)', async () => {
    // 11300 Piutang Usaha Kontrol has allowManualJournal = false
    const res = await request(harness.app.getHttpServer())
      .post('/finance/journals')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: new Date().toISOString(),
        reference: 'nex_p15_s1_manual_control',
        description: 'Attempt manual posting to AR control account P15',
        sourceDocumentType: 'MANUAL',
        lines: [
          { accountId: accounts['11300'].id, debit: 1000000, credit: 0 },
          { accountId: accounts['11100'].id, debit: 0, credit: 1000000 },
        ],
      });

    expect(res.status).toBe(400);
    expect(p15Message(res)).toContain('MANUAL_JOURNAL_BLOCKED');
  });

  it('AC-P15-01c: successfully posts balanced manual journal with allowed accounts', async () => {
    const res = await request(harness.app.getHttpServer())
      .post('/finance/journals')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: new Date().toISOString(),
        reference: 'nex_p15_s1_balanced_ok',
        description: 'Valid balanced journal entry P15',
        lines: [
          { accountId: accounts['11100'].id, debit: 750000, credit: 0 },
          { accountId: accounts['41100'].id, debit: 0, credit: 750000 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.reference).toBe('nex_p15_s1_balanced_ok');

    // Assert database lines strictly balance
    const saved = await harness.prisma.journalEntry.findUnique({
      where: { id: res.body.id },
      include: { lines: true },
    });
    expect(saved).toBeDefined();
    const sumDebit = saved!.lines.reduce((s, l) => s + Number(l.debit), 0);
    const sumCredit = saved!.lines.reduce((s, l) => s + Number(l.credit), 0);
    expect(sumDebit).toBe(750000);
    expect(sumCredit).toBe(750000);
    expect(sumDebit).toEqual(sumCredit);
  });

  it('AC-P15-01d: auto-journal engine creates balanced journal from cash disbursement', async () => {
    const res = await request(harness.app.getHttpServer())
      .post('/finance/cash/disburse')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: new Date().toISOString(),
        cashAccountId: accounts['11200'].id, // Bank BCA
        debitAccountId: accounts['61100'].id, // Operational expense
        category: 'BEBAN_OPERASIONAL',
        amount: 250000,
        entityName: 'PLN Listrik Pabrik P15',
        notes: 'nex_p15_cash_disburse_auto',
      });

    expect(res.status).toBe(201);
    expect(res.body.reference).toBeDefined();

    const journal = await harness.prisma.journalEntry.findUnique({
      where: { id: res.body.id },
      include: { lines: true },
    });
    expect(journal).toBeDefined();
    expect(journal!.lines).toHaveLength(2);
    const debitLine = journal!.lines.find((l) => Number(l.debit) > 0);
    const creditLine = journal!.lines.find((l) => Number(l.credit) > 0);
    expect(Number(debitLine!.debit)).toBe(250000);
    expect(Number(creditLine!.credit)).toBe(250000);
  });
});
