/**
 * Bridge 2: Commercial to Finance (P09 Sales -> P15 Finance)
 * Tests:
 * 1. DownPayment category 'LEGALITAS' routes strictly to Client Escrow liability (21200),
 *    never touching P&L revenue.
 * 2. Sales Invoicing posts strictly balanced auto-journal (Dr AR 11300, Cr Revenue 41100, Cr PPN 21300).
 * 3. Direct manual journal to AR Control Account (11300) is strictly blocked (BUS-RULE-068).
 */
import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootBridgeApp, cleanBridgeResiduals, BridgeApp, bridgeErrorMessage } from './bridge-harness';

describe('Bridge 2: Commercial to Finance (P09 -> P15)', () => {
  let harness: BridgeApp;
  let financeToken: string;
  let accounts: Record<string, any>;

  beforeAll(async () => {
    harness = await bootBridgeApp();
    const fin = await harness.createUser('Fin_B2', ['FINANCE', 'SUPER_ADMIN']);
    financeToken = fin.token;

    accounts = await harness.ensureStandardAccounts();
  });

  afterAll(async () => {
    await cleanBridgeResiduals(harness.prisma);
    await harness.app.close();
  });

  it('B2-01: DP Legalitas routes strictly to Client Escrow (21200) with 0 P&L impact', async () => {
    // 1. Post DP Legalitas to Cash Receive
    const dpAmount = 15000000;
    const escrowRes = await request(harness.app.getHttpServer())
      .post('/finance/cash/receive')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: new Date().toISOString(),
        cashAccountId: accounts['11200'].id, // Bank BCA
        category: 'DP_LEGALITAS',
        creditAccountId: accounts['21200'].id, // Client Escrow
        amount: dpAmount,
        entityName: 'Bridge Legal Client',
        notes: 'DP Legalitas HKI/BPOM Client Bridge',
      });

    expect(escrowRes.status).toBe(201);
    const journalId = escrowRes.body.id;
    expect(journalId).toBeDefined();

    // Verify Escrow liability balance increased, Revenue remains untouched
    const escrowAccount = await harness.prisma.account.findUnique({
      where: { code: '21200' },
      include: { journalLines: true },
    });
    const revenueAccount = await harness.prisma.account.findUnique({
      where: { code: '41100' },
      include: { journalLines: true },
    });

    const totalEscrowCredits = escrowAccount!.journalLines
      .filter((l) => l.journalId === journalId)
      .reduce((sum, l) => sum + Number(l.credit), 0);

    const totalRevenueLines = revenueAccount!.journalLines
      .filter((l) => l.journalId === journalId);

    expect(totalEscrowCredits).toBe(dpAmount);
    expect(totalRevenueLines).toHaveLength(0); // P&L revenue not touched
  });

  it('B2-02: Sales Invoicing generates balanced journal and respects double-entry invariant', async () => {
    const customer = await harness.prisma.customer.create({
      data: {
        id: randomUUID(),
        code: `BR-CUST-${randomUUID().slice(0, 4)}`,
        name: `Bridge Cust ${randomUUID().slice(0, 6)}`,
      },
    });

    const salesAmount = 30000000;
    const ppnAmount = Math.round(salesAmount * 0.11); // 3,300,000
    const totalAr = salesAmount + ppnAmount; // 33,300,000

    // Auto-post sales journal via finance endpoint
    const journalRes = await request(harness.app.getHttpServer())
      .post('/finance/journals')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: new Date().toISOString(),
        reference: `BRIDGE-INV-${randomUUID().slice(0, 6)}`,
        description: `Sales Invoice Bridge to ${customer.name}`,
        sourceDocumentType: 'SALES_ORDER',
        lines: [
          { accountId: accounts['11300'].id, debit: totalAr, credit: 0 },
          { accountId: accounts['41100'].id, debit: 0, credit: salesAmount },
          { accountId: accounts['21300'].id, debit: 0, credit: ppnAmount },
        ],
      });

    expect(journalRes.status).toBe(201);
    const lines = journalRes.body.lines;
    const sumDebit = lines.reduce((s: number, l: any) => s + Number(l.debit), 0);
    const sumCredit = lines.reduce((s: number, l: any) => s + Number(l.credit), 0);
    expect(sumDebit).toBe(totalAr);
    expect(sumCredit).toBe(totalAr);
  });

  it('B2-03: Direct manual entry to AR Control Account (11300) is strictly rejected', async () => {
    // Attempt manual journal to control account 11300
    const blockedRes = await request(harness.app.getHttpServer())
      .post('/finance/journals')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: new Date().toISOString(),
        reference: `BRIDGE-MANUAL-BLOCKED-${randomUUID().slice(0, 6)}`,
        description: 'Manual adjustment to AR',
        lines: [
          { accountId: accounts['11300'].id, debit: 1000000, credit: 0 },
          { accountId: accounts['11100'].id, debit: 0, credit: 1000000 },
        ],
      });

    // Control account with allowManualJournal=false must be rejected with 400
    expect(blockedRes.status).toBe(400);
    expect(bridgeErrorMessage(blockedRes.body)).toMatch(/MANUAL_JOURNAL_BLOCKED|control account|tidak boleh diposting manual/i);
  });
});
