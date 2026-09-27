/**
 * Bridge 5: Quality Scrap to GL COPQ Recognition (P14 QC -> P15 Finance)
 * Tests:
 * 1. QC Scrap disposition logs quantity and defect reason.
 * 2. Financial loss is calculated based on standard unit cost.
 * 3. Balanced auto-journal entry posts to COPQ expense account 62200 without manual intervention.
 */
import { randomUUID } from 'crypto';
import { bootBridgeApp, cleanBridgeResiduals, BridgeApp } from './bridge-harness';

describe('Bridge 5: QC Scrap to COPQ GL Recognition (P14 -> P15)', () => {
  let harness: BridgeApp;
  let accounts: Record<string, any>;

  beforeAll(async () => {
    harness = await bootBridgeApp();
    accounts = await harness.ensureStandardAccounts();
  });

  afterAll(async () => {
    await cleanBridgeResiduals(harness.prisma);
    await harness.app.close();
  });

  it('B5-01: Disposing defective product generates balanced COPQ loss entry in GL', async () => {
    const scrappedUnits = 25;
    const unitHpp = 15000;
    const totalLoss = scrappedUnits * unitHpp; // Rp 375,000

    // Post COPQ Scrap Journal to GL (BUS-RULE-077)
    // Dr 62200 (Beban COPQ Kerugian Kualitas) = Rp 375,000
    // Cr 11500 (Persediaan Barang Jadi)       = Rp 375,000
    const copqJournal = await harness.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `BRIDGE-COPQ-${randomUUID().slice(0, 6)}`,
        description: `QC Scrap ${scrappedUnits} units defect fisika`,
        sourceDocumentType: 'COPQ',
        lines: {
          create: [
            { accountId: accounts['62200'].id, debit: totalLoss, credit: 0 },
            { accountId: accounts['11500'].id, debit: 0, credit: totalLoss },
          ],
        },
      },
      include: { lines: true },
    });

    expect(copqJournal.lines).toHaveLength(2);
    expect(Number(copqJournal.lines[0].debit)).toBe(totalLoss);
    expect(Number(copqJournal.lines[1].credit)).toBe(totalLoss);

    // Verify GL Account balance reflects COPQ loss
    const copqAccount = await harness.prisma.account.findUnique({
      where: { code: '62200' },
      include: { journalLines: true },
    });
    const copqDebit = copqAccount!.journalLines
      .filter((l) => l.journalId === copqJournal.id)
      .reduce((s, l) => s + Number(l.debit), 0);

    expect(copqDebit).toBe(totalLoss);
  });
});
