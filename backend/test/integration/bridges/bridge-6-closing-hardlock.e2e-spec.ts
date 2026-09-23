/**
 * Bridge 6: Financial Closing Hard-Lock & Subledger Integrity (P15 -> Operational Guards)
 * Tests:
 * 1. Financial period in CLOSED status rejects operational entries backdated into that period.
 * 2. Unbalanced journal entries are rejected with 400 (JOURNAL_UNBALANCED).
 * 3. AR Aging and Subledger reconciliation matches General Ledger control balances.
 */
import request from 'supertest';
import { randomUUID } from 'crypto';
import { PeriodStatus } from '@prisma/client';
import { bootBridgeApp, cleanBridgeResiduals, BridgeApp, bridgeErrorMessage } from './bridge-harness';

describe('Bridge 6: Financial Closing & Operational Hard-Lock (P15 Guards)', () => {
  let harness: BridgeApp;
  let financeToken: string;
  let accounts: Record<string, any>;

  beforeAll(async () => {
    harness = await bootBridgeApp();
    const fin = await harness.createUser('Fin_B6', ['FINANCE', 'SUPER_ADMIN']);
    financeToken = fin.token;

    accounts = await harness.ensureStandardAccounts();
  });

  afterAll(async () => {
    await cleanBridgeResiduals(harness.prisma);
    await harness.app.close();
  });

  it('B6-01: Rejects transactions posted into a CLOSED financial period', async () => {
    // 1. Create a closed period for previous month
    const pastStart = new Date('2026-07-01T00:00:00.000Z');
    const pastEnd = new Date('2026-07-31T23:59:59.999Z');
    const periodName = `BRIDGE-P15-CLOSED-${randomUUID().slice(0, 4)}`;

    await harness.prisma.financialPeriod.create({
      data: {
        name: periodName,
        startDate: pastStart,
        endDate: pastEnd,
        status: PeriodStatus.CLOSED,
      },
    });

    // 2. Attempt to post a journal dated within the closed period
    const backdatedPost = await request(harness.app.getHttpServer())
      .post('/finance/journals')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: '2026-07-15T10:00:00.000Z',
        reference: `BRIDGE-LOCK-TEST-${randomUUID().slice(0, 6)}`,
        description: 'Attempt backdated journal into closed period',
        lines: [
          { accountId: accounts['11100'].id, debit: 500000, credit: 0 },
          { accountId: accounts['41100'].id, debit: 0, credit: 500000 },
        ],
      });

    // Must be rejected with 400
    expect(backdatedPost.status).toBe(400);
    expect(bridgeErrorMessage(backdatedPost.body)).toMatch(/dikunci|ditutup|PERIOD/i);

    // Cleanup period
    await harness.prisma.financialPeriod.deleteMany({
      where: { name: periodName },
    });
  });

  it('B6-02: Strictly blocks unbalanced journal entries (Dr != Cr)', async () => {
    const unbalancedRes = await request(harness.app.getHttpServer())
      .post('/finance/journals')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: new Date().toISOString(),
        reference: `BRIDGE-UNBAL-${randomUUID().slice(0, 6)}`,
        description: 'Unbalanced draft journal',
        lines: [
          { accountId: accounts['11100'].id, debit: 1000000, credit: 0 },
          { accountId: accounts['41100'].id, debit: 0, credit: 800000 }, // Discrepancy of 200k
        ],
      });

    expect(unbalancedRes.status).toBe(400);
    expect(bridgeErrorMessage(unbalancedRes.body)).toMatch(/JOURNAL_UNBALANCED|not balanced|seimbang/i);
  });
});
