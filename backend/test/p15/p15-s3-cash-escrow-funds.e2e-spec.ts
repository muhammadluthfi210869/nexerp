/**
 * P15-S3: Cash/Bank, Client Escrow & Maker-Checker Fund Requests
 *
 * Tests:
 * 1. Cash In & Cash Out operations generate balanced double-entry journals
 * 2. BUS-RULE-060 & BUS-RULE-061: DP Legalitas routes strictly to Client Escrow liability, never Revenue
 * 3. Segregation of Duties (SoD) on Fund Requests:
 *    Requester cannot approve their own request;
 *    Requester cannot disburse their own request.
 */
import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP15App, cleanP15Residuals, p15Message, P15App } from './p15-http-harness';

describe('P15-S3: Cash/Bank, Client Escrow & Maker-Checker Fund Requests', () => {
  let harness: P15App;
  let requesterUser: any;
  let requesterToken: string;
  let managerUser: any;
  let managerToken: string;
  let financeUser: any;
  let financeToken: string;
  let accounts: Record<string, any>;
  let customer: any;

  beforeAll(async () => {
    harness = await bootP15App();
    accounts = await harness.ensureStandardAccounts();

    const u1 = await harness.createUser('Requester_S3', ['FINANCE']);
    requesterUser = u1.user;
    requesterToken = u1.token;

    const u2 = await harness.createUser('Manager_S3', ['FINANCE']);
    managerUser = u2.user;
    managerToken = u2.token;

    const u3 = await harness.createUser('Disburser_S3', ['FINANCE', 'SUPER_ADMIN']);
    financeUser = u3.user;
    financeToken = u3.token;

    customer = await harness.prisma.customer.create({
      data: {
        id: randomUUID(),
        code: `P15-CUST-${randomUUID().slice(0, 4)}`,
        name: `nex_p15_client_brand_${randomUUID().slice(0, 6)}`,
      },
    });
  });

  afterAll(async () => {
    await cleanP15Residuals(harness.prisma);
    await harness.app.close();
  });

  it('AC-P15-03a: cash in creates balanced journal entry in database', async () => {
    const res = await request(harness.app.getHttpServer())
      .post('/finance/cash/receive')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: new Date().toISOString(),
        cashAccountId: accounts['11200'].id, // Bank BCA
        creditAccountId: accounts['41100'].id, // Sales Revenue
        category: 'PENDAPATAN_LAIN',
        amount: 5000000,
        entityName: customer.name,
        notes: 'nex_p15_cash_in_test',
      });

    expect(res.status).toBe(201);
    expect(res.body.reference).toBeDefined();

    const journal = await harness.prisma.journalEntry.findUnique({
      where: { id: res.body.id },
      include: { lines: true },
    });
    expect(journal).toBeDefined();
    const sumDebit = journal!.lines.reduce((s, l) => s + Number(l.debit), 0);
    const sumCredit = journal!.lines.reduce((s, l) => s + Number(l.credit), 0);
    expect(sumDebit).toBe(5000000);
    expect(sumCredit).toBe(5000000);
  });

  it('AC-P15-03b: DP Legalitas routes strictly to Client Escrow Deposit (Liability), rejects Revenue (BUS-RULE-060, BUS-RULE-061)', async () => {
    // 1. Attempt to credit Revenue account with DP_LEGALITAS -> must be rejected
    const badRes = await request(harness.app.getHttpServer())
      .post('/finance/cash/receive')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: new Date().toISOString(),
        cashAccountId: accounts['11200'].id,
        creditAccountId: accounts['41100'].id, // REVENUE account!
        category: 'DP_LEGALITAS',
        amount: 15000000,
        entityName: customer.name,
        notes: 'nex_p15_escrow_attempt_revenue',
      });

    expect(badRes.status).toBe(400);
    expect(p15Message(badRes)).toContain('BUS-RULE-060');

    // 2. Credit proper Liability account (21200 Client Escrow Deposit) -> succeeds
    const okRes = await request(harness.app.getHttpServer())
      .post('/finance/cash/receive')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: new Date().toISOString(),
        cashAccountId: accounts['11200'].id,
        creditAccountId: accounts['21200'].id, // LIABILITY: Client Escrow Deposit
        category: 'DP_LEGALITAS',
        referenceId: customer.id,
        amount: 15000000,
        entityName: customer.name,
        notes: 'nex_p15_escrow_deposit_valid',
      });

    expect(okRes.status).toBe(201);

    // Verify ClientEscrow record was created in database
    const escrow = await harness.prisma.clientEscrow.findFirst({
      where: { customerId: customer.id, notes: 'nex_p15_escrow_deposit_valid' },
    });
    expect(escrow).toBeDefined();
    expect(Number(escrow!.amount)).toBe(15000000);
    expect(escrow!.status).toBe('HELD');
  });

  it('AC-P15-03c: enforces maker-checker Segregation of Duties (SoD) on Fund Requests', async () => {
    // 1. Requester submits fund request
    const fundReq = await harness.prisma.fundRequest.create({
      data: {
        id: randomUUID(),
        requesterId: requesterUser.id,
        departmentId: 'COMMERCIAL',
        amount: 2500000,
        reason: 'nex_p15_fund_req_market_trip',
        status: 'PENDING_APPROVAL_MGR',
      },
    });

    // 2. Requester attempts to approve their own request -> blocked with 400 SoD violation
    const selfApproveRes = await request(harness.app.getHttpServer())
      .patch(`/finance/fund-request/${fundReq.id}/approve`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({ approvedById: requesterUser.id });

    expect(selfApproveRes.status).toBe(400);
    expect(p15Message(selfApproveRes)).toContain('SOD_VIOLATION');

    // 3. Manager approves the request -> succeeds
    const mgrApproveRes = await request(harness.app.getHttpServer())
      .patch(`/finance/fund-request/${fundReq.id}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ approvedById: managerUser.id });

    expect(mgrApproveRes.status).toBe(200);
    expect(mgrApproveRes.body.status).toBe('APPROVED_BY_MGR');

    // 4. Requester attempts to disburse their own approved request -> blocked with 400 SoD violation
    const selfDisburseRes = await request(harness.app.getHttpServer())
      .post(`/finance/fund-request/${fundReq.id}/disburse`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        disbursedById: requesterUser.id,
        accountId: accounts['11200'].id,
      });

    expect(selfDisburseRes.status).toBe(400);
    expect(p15Message(selfDisburseRes)).toContain('SOD_VIOLATION');

    // 5. Finance user disburses the request -> succeeds, generates balanced journal
    const disburseRes = await request(harness.app.getHttpServer())
      .post(`/finance/fund-request/${fundReq.id}/disburse`)
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        disbursedById: financeUser.id,
        accountId: accounts['11200'].id,
      });

    expect(disburseRes.status).toBe(201);
    expect(disburseRes.body.status).toBe('PAID');

    // Verify journal was created for the disbursement
    const journal = await harness.prisma.journalEntry.findFirst({
      where: { reference: `FUND-DISB-${fundReq.id.substring(0, 8)}` },
      include: { lines: true },
    });
    expect(journal).toBeDefined();
    expect(journal!.lines).toHaveLength(2);
    expect(Number(journal!.lines[0].debit) + Number(journal!.lines[1].debit)).toBe(2500000);
    expect(Number(journal!.lines[0].credit) + Number(journal!.lines[1].credit)).toBe(2500000);
  });
});
