import { HttpException } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';

/**
 * Fase 3b — Auto-Journal 9-trigger. THE FAILING REPRODUCTION (CLAUDE.md rule:
 * every bug gets a reproduction that fails FIRST, then the fix, then green).
 *
 * What is broken today, measured 2026-09-25:
 *
 *   1. NO WRITE POINT ASSERTS `Σdebit == Σcredit`. A journal entry is created by
 *      a plain `journalEntry.create({ data: { lines: { create: [...] } } })` at
 *      24 call sites across 13 files. Nothing checks the two sides before commit.
 *
 *   2. THE DEFECT IS LIVE, not hypothetical. `payments.service.ts:88-94` resolves
 *      its cash account by COA code `1101`, which does NOT exist in the live chart
 *      of accounts (32 rows). The guard it uses is `journalLines.length > 0` — not
 *      a balance check — so when the cash leg is dropped the remaining
 *      `arAcc` (1103, which DOES exist) credit still commits. Result: an entry with
 *      Σdebit = 0 and Σcredit = arSettled, sitting in the ledger unreconciled.
 *
 *   3. `JournalEngineService.generateJournal` — the one service meant to own this —
 *      throws for every call: it reads `auto_journal_configs`, which has 0 rows.
 *      It is imported by no business module. The engine is not the gate; it is
 *      dead code with a live-looking name.
 *
 * This spec asserts the invariant that SHOULD hold. It is expected to FAIL until
 * the balance guard lands in `PrismaService`.
 */
const TAG = 'nex_aj_probe';

describe('auto-journal balance is enforced at the write point (Fase 3b)', () => {
  let prisma: PrismaService;
  const created: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
  }, 60000);

  // Sweep by REFERENCE, not by the collected ids. A rejected create returns no id,
  // so `created[]` cannot cover it — which is exactly how the first RED run of this
  // very spec left two unbalanced entries behind and broke `p15-golden-thread`
  // (its trial balance window is Jan 1 → now, so it read the residue). The suite
  // must be able to clean up after its own failures.
  afterAll(async () => {
    const leaked = await prisma.journalEntry.findMany({
      where: { reference: { startsWith: TAG } },
      select: { id: true },
    });
    const ids = [...new Set([...created, ...leaked.map((j) => j.id)])];
    if (ids.length) {
      await prisma.journalLine.deleteMany({ where: { journalId: { in: ids } } });
      await prisma.journalEntry.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  }, 60000);

  /** Sum both sides of the entry as it was actually persisted. */
  async function persistedBalance(journalId: string) {
    const lines = await prisma.journalLine.findMany({
      where: { journalId },
      select: { debit: true, credit: true },
    });
    const debit = lines.reduce((s, l) => s + Number(l.debit ?? 0), 0);
    const credit = lines.reduce((s, l) => s + Number(l.credit ?? 0), 0);
    return { debit, credit, diff: debit - credit, count: lines.length };
  }

  it('1. a BALANCED entry is accepted (the guard must not break correct writes)', async () => {
    const accounts = await prisma.account.findMany({ take: 2, select: { id: true } });
    expect(accounts.length).toBeGreaterThanOrEqual(2);

    const entry = await prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `${TAG}-OK`,
        description: `${TAG} balanced`,
        lines: {
          create: [
            { accountId: accounts[0].id, debit: 150000, credit: 0 },
            { accountId: accounts[1].id, debit: 0, credit: 150000 },
          ],
        },
      },
    });
    created.push(entry.id);

    const bal = await persistedBalance(entry.id);
    expect(bal.count).toBe(2);
    expect(bal.diff).toBe(0);
  }, 60000);

  it('2. an UNBALANCED entry is REFUSED at the write point', async () => {
    const accounts = await prisma.account.findMany({ take: 2, select: { id: true } });

    // Exactly the shape `payments.service.ts:88-94` produces when the cash leg is
    // dropped: only the credit side survives.
    await expect(
      prisma.journalEntry.create({
        data: {
          date: new Date(),
          reference: `${TAG}-ONE-SIDED`,
          description: `${TAG} one-sided debit leg missing`,
          lines: {
            create: [{ accountId: accounts[0].id, debit: 0, credit: 26600000 }],
          },
        },
      }),
    ).rejects.toThrow(/balance|seimbang|JOURNAL_UNBALANCED/i);
  }, 60000);

  it('3. an entry with NO lines is REFUSED (a journal with no double entry is not a journal)', async () => {
    await expect(
      prisma.journalEntry.create({
        data: {
          date: new Date(),
          reference: `${TAG}-EMPTY`,
          description: `${TAG} zero lines`,
          lines: { create: [] },
        },
      }),
    ).rejects.toThrow(/balance|seimbang|JOURNAL_UNBALANCED/i);
  }, 60000);

  it('4. the guard also holds INSIDE an interactive transaction', async () => {
    const accounts = await prisma.account.findMany({ take: 2, select: { id: true } });

    await expect(
      prisma.$transaction(async (tx) => {
        return tx.journalEntry.create({
          data: {
            date: new Date(),
            reference: `${TAG}-TX`,
            description: `${TAG} one-sided inside tx`,
            lines: {
              create: [{ accountId: accounts[0].id, debit: 500000, credit: 0 }],
            },
          },
        });
      }),
    ).rejects.toThrow(/balance|seimbang|JOURNAL_UNBALANCED/i);
  }, 60000);

  // CONTROL for test 4. Without this, test 4 would pass even if the extension had
  // broken transaction writes outright — a dead `tx` path also throws. The
  // rejection has to come from the BALANCE rule, not from the path being unusable.
  it('5. a BALANCED entry inside an interactive transaction still commits', async () => {
    const accounts = await prisma.account.findMany({ take: 2, select: { id: true } });

    const entry = await prisma.$transaction(async (tx) => {
      return tx.journalEntry.create({
        data: {
          date: new Date(),
          reference: `${TAG}-TX-OK`,
          description: `${TAG} balanced inside tx`,
          lines: {
            create: [
              { accountId: accounts[0].id, debit: 4200, credit: 0 },
              { accountId: accounts[1].id, debit: 0, credit: 4200 },
            ],
          },
        },
      });
    });
    created.push(entry.id);

    const bal = await persistedBalance(entry.id);
    expect(bal.count).toBe(2);
    expect(bal.diff).toBe(0);
  }, 60000);

  // The 24 operational call sites sit behind HTTP routes, so the refusal has to be
  // a 400 — a guard that surfaces as a 500 still fails closed, but tells the caller
  // "server broke" instead of "your entry is unbalanced".
  it('6. the refusal is a 400-level HttpException, not a raw crash', async () => {
    const accounts = await prisma.account.findMany({ take: 2, select: { id: true } });

    let caught: any;
    try {
      await prisma.journalEntry.create({
        data: {
          date: new Date(),
          reference: `${TAG}-STATUS`,
          description: `${TAG} status probe`,
          lines: {
            create: [{ accountId: accounts[0].id, debit: 0, credit: 999 }],
          },
        },
      });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(HttpException);
    expect(caught.getStatus()).toBe(400);
  }, 60000);
});