/**
 * Fase 3C — the financial statement builders moved out of FinanceService.
 *
 * Why this exists: `finance.service.ts` was a 2628-line class holding posting,
 * tax, fund requests AND the 481-line report cluster. The cluster is the one
 * contiguous seam in the file: six pure reads that touch only `prisma.account`,
 * `prisma.journalLine`, `prisma.journalEntry` and each other.
 *
 * Two things must stay true after the move, and this spec is what keeps them
 * true — a pure "did it move" test would rot the moment someone moved it back.
 *
 *   1. **The contract did not change.** Every existing caller (4 production
 *      files, 4 e2e specs, `finance-coa-integrity.unit-spec.ts`) still calls
 *      `FinanceService.getTrialBalance(...)`. The facade must keep working, and
 *      must actually forward — not silently re-grow its own copy.
 *   2. **The bodies really left.** The facade keeps no report logic, so the
 *      P&L bucketing / unplaced-account handling has exactly one home.
 *
 * Assertions are on type and delegation rather than output shape on purpose:
 * `legality.unit-spec.ts:77` broke in Fase 3B because it asserted prose. Wiring
 * is asserted here; the numbers are asserted by the p15/p20 e2e specs, which
 * run the real queries against the live DB.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { FinanceService } from '../../src/modules/finance/finance.service';
import { FinanceReportService } from '../../src/modules/finance/finance-report.service';

/** The six methods in the `FINANCIAL REPORTS (PHASE 4)` cluster, in file order. */
const REPORT_METHODS = [
  'getTrialBalance',
  'getDetailedTrialBalance',
  'getBalanceSheet',
  'getProfitLoss',
  'getCashFlow',
  'getGeneralLedger',
] as const;

const readSource = (file: string) =>
  readFileSync(
    join(__dirname, '..', '..', 'src', 'modules', 'finance', file),
    'utf8',
  );

/** Reaching a method by name without widening to `any` — eslint bans `Function`. */
type Callable = (this: unknown, ...args: unknown[]) => unknown;

/** `new FinanceService(...)` with every collaborator stubbed. */
const buildFacade = (reportService: unknown) =>
  new FinanceService(
    {} as never, // prisma
    {} as never, // eventEmitter
    {} as never, // idGenerator
    {} as never, // scmService
    {} as never, // creativeService
    {} as never, // moduleRef
    reportService as never,
  );

describe('Fase 3C — financial reports live in their own service', () => {
  const methodsOf = (prototype: object) =>
    prototype as unknown as Record<string, Callable>;

  it('FinanceReportService declares all six report methods', () => {
    for (const method of REPORT_METHODS) {
      expect(typeof methodsOf(FinanceReportService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it('FinanceService still declares all six (the facade is intact)', () => {
    for (const method of REPORT_METHODS) {
      expect(typeof methodsOf(FinanceService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it.each(REPORT_METHODS)(
    'FinanceService.%s forwards to FinanceReportService exactly once',
    async (method) => {
      const reportService = Object.fromEntries(
        REPORT_METHODS.map((m) => [m, jest.fn().mockResolvedValue('delegated')]),
      );
      const service = buildFacade(reportService);
      const call = methodsOf(service);

      const result = await call[method].call(service);

      expect(result).toBe('delegated');
      expect(reportService[method]).toHaveBeenCalledTimes(1);
    },
  );

  it.each(REPORT_METHODS)(
    'FinanceService.%s forwards its arguments unchanged',
    async (method) => {
      const reportService = Object.fromEntries(
        REPORT_METHODS.map((m) => [m, jest.fn().mockResolvedValue('delegated')]),
      );
      const service = buildFacade(reportService);
      const call = methodsOf(service);

      await call[method].call(service, 'a', 'b', 'c');

      expect(reportService[method]).toHaveBeenCalledWith('a', 'b', 'c');
    },
  );

  describe('the facade keeps no report bodies', () => {
    const facade = readSource('finance.service.ts');

    it('no longer declares the report types', () => {
      expect(facade).not.toContain('type ReportLine =');
      expect(facade).not.toContain('type ReportBucket =');
      expect(facade).not.toContain('type UnplacedAccount =');
    });

    it('no longer contains the report logic', () => {
      // The unplaced-account reason strings are the cluster's fingerprint: they
      // exist nowhere else in the repo and are the thing the 3B/2 cleanup added.
      expect(facade).not.toContain('REPORT_GROUP_NOT_MAPPED');
      expect(facade).not.toContain('HEADER_ACCOUNT_HAS_OWN_LINES');
      // And it must not query the ledger directly any more.
      expect(facade).not.toContain('this.prisma.journalLine');
    });

    it('delegates instead', () => {
      for (const method of REPORT_METHODS) {
        expect(facade).toContain(`this.reportService.${method}(`);
      }
    });

    it('got smaller — under 2200 lines (was 2628)', () => {
      expect(facade.split('\n').length).toBeLessThan(2200);
    });
  });

  describe('the extracted service', () => {
    const extracted = readSource('finance-report.service.ts');

    it('carries the report types and logic', () => {
      expect(extracted).toContain('type ReportLine =');
      expect(extracted).toContain('type ReportBucket =');
      expect(extracted).toContain('type UnplacedAccount =');
      expect(extracted).toContain('REPORT_GROUP_NOT_MAPPED');
      expect(extracted).toContain('HEADER_ACCOUNT_HAS_OWN_LINES');
    });

    it('depends on prisma and nothing else', () => {
      // A report builder that needs the journal engine, SCM or the event bus is
      // not a report builder — it is the god service renamed.
      expect(extracted).toContain('private prisma: PrismaService');
      expect(extracted).not.toContain('ScmService');
      expect(extracted).not.toContain('EventEmitter2');
      expect(extracted).not.toContain('IdGeneratorService');
      expect(extracted).not.toContain('ModuleRef');
      expect(extracted).not.toContain('CreativeService');
    });

    it('does not depend on FinanceService', () => {
      // The header doc names FinanceService on purpose (it explains the split),
      // so the assertion is about code, not prose: no import, no inheritance.
      expect(extracted).not.toMatch(/from '\.\/finance\.service'/);
      expect(extracted).not.toMatch(/extends\s+FinanceService/);
    });
  });

  it('is registered as a provider in finance.module.ts', () => {
    const module = readSource('finance.module.ts');
    expect(module).toContain('FinanceReportService');
  });
});
