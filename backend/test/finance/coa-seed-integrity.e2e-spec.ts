import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { FinanceService } from '../../src/modules/finance/finance.service';
import { IdGeneratorService } from '../../src/modules/system/id-generator.service';
import { ScmService } from '../../src/modules/scm/services/scm.service';
import { CreativeService } from '../../src/modules/creative/creative.service';

/**
 * Fase 2 — the chart of accounts must contain every code the posting code
 * resolves, measured against the real database.
 *
 * Reproduced 2026-09-26 on the live `erp_db_test` (73 accounts):
 *
 *   `finance.service.ts` resolved `1121`, `1153`, `1154` and `6224`. None of them
 *   existed — `seedInitialAccounts()` opened with
 *   `if (await account.count() > 0) return;`, so once any other COA seed had
 *   populated the table it became a permanent no-op. For those four the fix was
 *   to stop resolving codes that mean nothing new: an account with the right
 *   meaning already exists (`1110` bank, `1302` WIP, `1303` FG). The chains now
 *   point at it. Only `6224` — bank administration fees — is genuinely absent and
 *   genuinely needed, so the seed creates it.
 *
 *   With those accounts absent the posting code fell through its OR-chains:
 *
 *     WIP  → `1401 Uang Muka Pembelian (Advance)`   [an asset advance, not WIP]
 *     FG   → `1400 PPN Masukan (Input Tax)`          [an input tax credit, not FG]
 *     cash → `1100 Kas & Bank (Aset Lancar)`         [a catch-all, not the bank]
 *
 *   No error, no log — a wrong account on a balance sheet is indistinguishable
 *   from a right one until someone reconciles it by hand.
 *
 * The unit spec (`test/unit/finance-coa-integrity.unit-spec.ts`) pins the shape
 * with mocks. This one runs the same call against real Prisma and asserts the
 * rows exist afterwards, because a mock cannot prove a row was written.
 */
/** Every code `seedInitialAccounts()` must ensure exists after it runs. Four
 *  entries were dropped from the seed rather than created — `1121`, `1132`,
 *  `1153`, `1154` — because an account meaning the same thing already exists
 *  (`1110`, `1200`/`1201`, `1302`, `1303`) and a second one would split the
 *  balance. The fallback chains were repointed at those existing accounts. */
const REQUIRED_CODES = ['1151', '2101', '2102', '4101', '4102', '6101', '6224', '6232'];

describe('COA seed integrity against the live database (Fase 2)', () => {
  let prisma: PrismaService;
  let service: FinanceService;
  /** Every account code present before this spec ran. Cleanup deletes exactly the
   *  codes that appeared afterwards, so nothing this spec created is left behind.
   *
   *  This used to be a fixed list (`REQUIRED_CODES` plus the ones absent), which
   *  leaked: `seedInitialAccounts()` creates more codes than that list names, and
   *  an earlier run left `1132 Piutang Dagang - kosmetik` in the database, growing
   *  the table from 73 to 74. A leaked account is not inert — `getTrialBalance`
   *  and the P&L read the whole table, so residue shows up in other specs'
   *  assertions. Diffing the full code set cannot leak, whatever the seed grows
   *  to. */
  let codesBefore: Set<string>;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();

    const module = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        {
          provide: IdGeneratorService,
          useValue: { generateId: jest.fn().mockResolvedValue('JRN-COA-PROBE') },
        },
        { provide: ScmService, useValue: {} },
        { provide: CreativeService, useValue: {} },
        { provide: ModuleRef, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);

    // Snapshot the whole code set, not just the codes this spec expects to touch.
    // A pre-existing account therefore never enters the delete set, and a code
    // the seed creates that this spec did not anticipate still does.
    const before = await prisma.account.findMany({ select: { code: true } });
    codesBefore = new Set(before.map((a) => a.code));
  }, 60000);

  afterAll(async () => {
    const after = await prisma.account.findMany({ select: { code: true } });
    const created: string[] = after.map((a) => a.code).filter((c) => !codesBefore.has(c));

    if (created.length) {
      // Refuse to delete an account that picked up journal lines between the
      // probe and the cleanup: removing it would cascade a hole in the ledger.
      const withLines = await prisma.journalLine.findMany({
        where: { account: { code: { in: created } } },
        select: { account: { select: { code: true } } },
      });
      const keep = new Set(withLines.map((l: { account: { code: string } }) => l.account.code));
      const removable = created.filter((c: string) => !keep.has(c));
      if (removable.length) {
        await prisma.account.deleteMany({ where: { code: { in: removable } } });
      }
    }
    await prisma.$disconnect();
  });

  it('creates every account the posting code resolves, on a database that already has a COA', async () => {
    const totalBefore = await prisma.account.count();
    // The reproduction condition: the table is already populated, which is what
    // made the old `count() > 0` guard return early.
    expect(totalBefore).toBeGreaterThan(0);

    const result = await service.seedInitialAccounts();
    expect(result.required).toBeGreaterThan(0);

    const rows = await prisma.account.findMany({
      where: { code: { in: REQUIRED_CODES } },
      select: { code: true, name: true, type: true, normalBalance: true, reportGroup: true },
    });
    const found = new Map(rows.map((r) => [r.code, r]));

    const missing = REQUIRED_CODES.filter((c) => !found.has(c));
    expect(missing).toEqual([]);

    // Present is not enough — the row has to be usable as the account the
    // posting code expects. A null `reportGroup` drops the account out of every
    // report, which is how a "created" account can still be invisible.
    for (const code of REQUIRED_CODES) {
      const row = found.get(code)!;
      expect(row.reportGroup).not.toBeNull();
      expect(row.normalBalance).toBeTruthy();
    }
  }, 60000);

  it('is idempotent — a second run neither duplicates nor throws', async () => {
    await service.seedInitialAccounts();

    for (const code of REQUIRED_CODES) {
      const count = await prisma.account.count({ where: { code } });
      expect({ code, count }).toEqual({ code, count: 1 });
    }
  }, 60000);

  it('leaves the reclassified asset accounts addressable as assets, not expenses', async () => {
    // `reportGroup` defaults to `OTHER_EXPENSE` in the Prisma schema, so an
    // account created without one is routed to the expense side of the P&L.
    // `1103` and `1151` shipped that way.
    const rows = await prisma.account.findMany({
      where: { code: { in: ['1103', '1151'] } },
      select: { code: true, type: true, reportGroup: true },
    });

    for (const row of rows) {
      expect(row.type).toBe('ASSET');
      expect(row.reportGroup).not.toBe('OTHER_EXPENSE');
    }
  }, 60000);
});
