/**
 * Fase 2 — COA integrity regressions.
 *
 * Two defects measured on the live database on 2026-09-26:
 *
 *  1. `getProfitLoss` drops every account that has no parent
 *     (`if (!acc.parent) return;`) and every account whose `reportGroup` it does
 *     not recognise (`default: return;`), then returns totals. All 73 live
 *     accounts have `parentId = NULL`, so the P&L renders as a structurally
 *     valid, entirely zero report — indistinguishable from a period with no
 *     activity. A report that silently omits its own inputs is worse than one
 *     that errors.
 *
 *  2. `seedInitialAccounts()` opens with `if (await account.count() > 0) return;`.
 *     A competing COA seed populated 73 accounts first, so this function has
 *     never run, and the five accounts the posting code below requires —
 *     1121, 1153, 1154, 1157, 6224 — do not exist. The OR-fallbacks in
 *     `finance.service.ts` then silently post Work In Progress to
 *     `1401 Uang Muka Pembelian` and Finished Goods to `1400 PPN Masukan`.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from '../../src/modules/finance/finance.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../src/modules/system/id-generator.service';
import { ScmService } from '../../src/modules/scm/services/scm.service';
import { CreativeService } from '../../src/modules/creative/creative.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';

/** Every code `seedInitialAccounts()` must ensure exists, on any database.
 *
 *  This was 12 entries. Four were removed rather than kept — `1121` (a second
 *  bank account), `1132` (a second receivable), `1153` and `1154` (a second WIP
 *  and a second Finished Goods). Each duplicated an account that already exists
 *  and means the same thing (`1110`, `1200`/`1201`, `1302`, `1303`), and creating
 *  a parallel account splits a balance across two rows no report can tell apart.
 *
 *  `1157` and `1120` were never in this list — they are phantoms. Creating `1157`
 *  would move future stock-opname losses into a new empty account while the
 *  existing Rp 26,600,000 sits in `6232`. The fix there is to delete the dead
 *  preference from the fallback chain, not to create the account. */
const SEEDED_CODES = ['1151', '2101', '2102', '4101', '4102', '6101', '6224', '6232'];

/** Referenced only as a fallback that cannot be reached, because the account
 *  does not exist and the next code in the chain is the one that holds the data.
 *  Keeping them suggests a preference that was never real. */
const PHANTOM_POSTING_CODES = ['1157', '1120'];

interface AccountRow {
  id: string;
  code: string;
  name: string;
  type: string;
  reportGroup: string | null;
  parentId: string | null;
  parent?: unknown;
  children?: unknown[];
}

const account = (over: Partial<AccountRow>): AccountRow => ({
  id: over.code ?? 'id',
  code: '0000',
  name: 'account',
  type: 'EXPENSE',
  reportGroup: null,
  parentId: null,
  parent: null,
  children: [],
  ...over,
});

describe('FinanceService — COA integrity (Fase 2)', () => {
  let service: FinanceService;
  let findMany: jest.Mock;
  let count: jest.Mock;
  let create: jest.Mock;
  let upsert: jest.Mock;
  let createMany: jest.Mock;

  beforeEach(async () => {
    findMany = jest.fn();
    count = jest.fn();
    create = jest.fn();
    upsert = jest.fn();
    createMany = jest.fn();

    const prisma: Record<string, unknown> = {
      account: { findMany, count, create, upsert, createMany, findFirst: jest.fn() },
      financialPeriod: { findFirst: jest.fn() },
      journalEntry: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
      invoice: { findMany: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
      salesOrder: { findMany: jest.fn() },
      deliveryOrder: { findMany: jest.fn() },
      salesLead: { findMany: jest.fn() },
    };
    prisma.$transaction = jest.fn((cb: (tx: unknown) => unknown) => cb(prisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: IdGeneratorService, useValue: { generateId: jest.fn().mockResolvedValue('JRN-1') } },
        { provide: ScmService, useValue: {} },
        { provide: CreativeService, useValue: {} },
        { provide: ModuleRef, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  describe('getProfitLoss on a flat chart of accounts', () => {
    // The live COA is flat: 73 accounts, every one `parentId = NULL`.
    const FLAT_COA: AccountRow[] = [
      account({
        id: 'a-rev',
        code: '4100',
        name: 'Pendapatan Penjualan Maklon',
        type: 'REVENUE',
        reportGroup: 'OPERATING_REVENUE',
      }),
      account({
        id: 'a-hpp',
        code: '5100',
        name: 'Beban Pokok Penjualan (HPP)',
        type: 'EXPENSE',
        reportGroup: 'COGS',
      }),
    ];

    beforeEach(() => {
      // 1st findMany = the P&L's own account fetch; 2nd = getTrialBalance's.
      findMany.mockResolvedValueOnce(FLAT_COA).mockResolvedValueOnce(
        FLAT_COA.map((a) => ({
          ...a,
          journalLines: [],
        })),
      );
    });

    it('counts a parentless revenue account instead of dropping it', async () => {
      // The trial balance the report reads from; the account carries a credit
      // balance because revenue is credit-normal.
      const tbAccounts = FLAT_COA.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        type: a.type,
        reportGroup: a.reportGroup,
        parentId: a.parentId,
        journalLines: [
          {
            debit: a.type === 'EXPENSE' ? 400_000 : 0,
            credit: a.type === 'REVENUE' ? 1_000_000 : 0,
          },
        ],
      }));
      findMany.mockReset();
      findMany.mockResolvedValueOnce(FLAT_COA).mockResolvedValueOnce(tbAccounts);

      const report = await service.getProfitLoss(new Date('2026-01-01'), new Date('2026-12-31'));

      // A flat COA is what the database actually holds. Dropping every
      // parentless account means this total is 0 while the ledger says otherwise.
      expect(report.revenue.total).toBe(1_000_000);
      expect(report.expenses.total).toBe(400_000);
    });

    it('reports the accounts it could not place rather than dropping them silently', async () => {
      // `reportGroup = null` currently hits `default: return;` and vanishes.
      const withUnmapped = [
        ...FLAT_COA,
        account({
          id: 'a-unmapped',
          code: '9999',
          name: 'Akun Tanpa Grup Laporan',
          type: 'EXPENSE',
          reportGroup: null,
        }),
      ];
      findMany.mockReset();
      findMany
        .mockResolvedValueOnce(withUnmapped)
        .mockResolvedValueOnce(withUnmapped.map((a) => ({ ...a, journalLines: [] })));

      const report = await service.getProfitLoss(new Date('2026-01-01'), new Date('2026-12-31'));

      // The report must be able to say "I omitted N accounts". Without this a
      // missing reportGroup is invisible on a financial statement.
      expect(report).toHaveProperty('unplacedAccounts');
      expect(report.unplacedAccounts.map((a: { code: string }) => a.code)).toContain('9999');
    });

    it('does not invent a total from accounts it skipped', async () => {
      findMany.mockReset();
      findMany.mockResolvedValueOnce(FLAT_COA).mockResolvedValueOnce(
        FLAT_COA.map((a) => ({ ...a, journalLines: [{ debit: 0, credit: 0 }] })),
      );

      const report = await service.getProfitLoss(new Date('2026-01-01'), new Date('2026-12-31'));

      // Silence must be distinguishable from zero activity.
      expect(report.revenue.total).toBe(0);
      expect(report.unplacedAccounts).toHaveLength(0);
    });
  });

  describe('seedInitialAccounts against a database that already has a COA', () => {
    it('still ensures the posting accounts exist when the table is not empty', async () => {
      // Reproduction of the live condition: 73 accounts exist from a competing
      // seed, so the old `if (count > 0) return;` guard made this a no-op and
      // the required accounts were never created.
      count.mockResolvedValue(73);
      findMany.mockResolvedValue([]); // none of the required codes present
      upsert.mockResolvedValue({});
      createMany.mockResolvedValue({ count: 0 });

      await service.seedInitialAccounts();

      const touched = new Set<string>();
      for (const call of [...upsert.mock.calls, ...create.mock.calls, ...createMany.mock.calls]) {
        const arg = call[0] as Record<string, unknown>;
        if (arg && typeof arg === 'object') {
          if (typeof arg.code === 'string') touched.add(arg.code);
          const data = (arg as { data?: unknown }).data;
          const rows = Array.isArray(data) ? data : [data];
          for (const row of rows) {
            const code = (row as { code?: unknown })?.code;
            if (typeof code === 'string') touched.add(code);
          }
          const where = (arg as { where?: { code?: unknown } }).where;
          if (where && typeof where.code === 'string') touched.add(where.code);
        }
      }

      for (const code of SEEDED_CODES) {
        expect(touched).toContain(code);
      }
    });

    it('is idempotent — running it twice must not fail on an existing account', async () => {
      count.mockResolvedValue(73);
      findMany.mockResolvedValue([]);
      upsert.mockResolvedValue({});
      createMany.mockResolvedValue({ count: 0 });

      await expect(service.seedInitialAccounts()).resolves.not.toThrow();
    });
  });

  describe('fallback chains in the posting code', () => {
    // A fallback whose first code can never resolve is not a fallback — it is a
    // comment that reads like a decision. `1157` and `1120` do not exist in any
    // environment, so every chain that opens with them really opens with the
    // code that follows.
    it('does not prefer an account that is never created', () => {
      const source = readFileSync(
        join(__dirname, '..', '..', 'src', 'modules', 'finance', 'finance.service.ts'),
        'utf8',
      );

      for (const code of PHANTOM_POSTING_CODES) {
        const asPreference = new RegExp(`OR:\\s*\\[\\s*\\{\\s*code:\\s*'${code}'`);
        expect(source).not.toMatch(asPreference);
      }
    });
  });
});
