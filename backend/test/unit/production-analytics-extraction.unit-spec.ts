/**
 * Fase 3C (part 2) — the analytics reads moved out of ProductionService.
 *
 * `production.service.ts` was 3533 lines after the report cluster left
 * `FinanceService`. Sixteen of its 55 methods share one property the rest do
 * not: they only read. Measured before the move, not assumed —
 * `findMany`/`aggregate`/`groupBy`/`count`/`findUnique`, and `.aggregate(` /
 * `.groupBy(` appear *nowhere else in the file*, which is why they are the
 * fingerprint this spec asserts on.
 *
 * The file's own author already saw the boundary: methods 343–988 and
 * 1215–1349 and 3017–3455 are the dashboards, floor view, leakage and
 * timeline; what sits between them is the write path (stage logging, material
 * issue, scheduling, QC, costing).
 *
 * This one has *no* consumers outside the production module: the only
 * production caller is `production.controller.ts`, and two unit specs drive
 * four of these methods directly. Four other modules (`hr`, `scm`, `marketing`,
 * `lead-capture`) expose a *method of the same name* on their own service —
 * measured, because a name-matching grep suggests a dependency that is not
 * there. The facade still stays, for the same reason as the finance slice: the
 * controller and those specs should not have to change because a file split.
 *
 * Red-first: the suite could not collect until the new service existed. Then
 * the delegation assertions were proven non-tautological by stubbing one
 * method locally (3 tests failed; restoring went green).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ProductionService } from '../../src/modules/production/production.service';
import { ProductionAnalyticsService } from '../../src/modules/production/production-analytics.service';

/** The read-only cluster, in file order. */
const ANALYTICS_METHODS = [
  'getDashboardAnalytics',
  'getMachineOEE',
  'getStepLogs',
  'getProductionAudit',
  'getChainOfCustody',
  'getWarehousePreparation',
  'getBatchGranularAudit',
  'getProductionLeads',
  'getMicroFlowDiagnostics',
  'getWorkOrders',
  'getActiveWorkOrders',
  'getExecutiveSummary',
  'getQCStats',
  'getFloorData',
  'getLeakageData',
  'getWorkOrderTimeline',
] as const;

const readSource = (file: string) =>
  readFileSync(
    join(__dirname, '..', '..', 'src', 'modules', 'production', file),
    'utf8',
  );

/** Reaching a method by name without widening to `any` — eslint bans `Function`. */
type Callable = (this: unknown, ...args: unknown[]) => unknown;

const methodsOf = (prototype: object) =>
  prototype as unknown as Record<string, Callable>;

/** `new ProductionService(...)` with every collaborator stubbed. */
const buildFacade = (analytics: unknown) =>
  new ProductionService(
    {} as never, // prisma
    {} as never, // eventEmitter
    {} as never, // idGenerator
    analytics as never, // analytics
    {} as never, // batchRecords
    {} as never, // planning
    {} as never, // actuals
    {} as never, // execution
    {} as never, // audit
  );

describe('Fase 3C — production analytics live in their own service', () => {
  it('ProductionAnalyticsService declares all sixteen read methods', () => {
    for (const method of ANALYTICS_METHODS) {
      expect(typeof methodsOf(ProductionAnalyticsService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it('ProductionService still declares all sixteen (the facade is intact)', () => {
    for (const method of ANALYTICS_METHODS) {
      expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it.each(ANALYTICS_METHODS)(
    'ProductionService.%s forwards to ProductionAnalyticsService exactly once',
    async (method) => {
      const analytics = Object.fromEntries(
        ANALYTICS_METHODS.map((m) => [m, jest.fn().mockResolvedValue('delegated')]),
      );
      const service = buildFacade(analytics);
      const call = methodsOf(service);

      const result = await call[method].call(service);

      expect(result).toBe('delegated');
      expect(analytics[method]).toHaveBeenCalledTimes(1);
    },
  );

  it.each(ANALYTICS_METHODS)(
    'ProductionService.%s forwards its arguments unchanged',
    async (method) => {
      const analytics = Object.fromEntries(
        ANALYTICS_METHODS.map((m) => [m, jest.fn().mockResolvedValue('delegated')]),
      );
      const service = buildFacade(analytics);
      const call = methodsOf(service);

      await call[method].call(service, 'a', 'b', 'c');

      expect(analytics[method]).toHaveBeenCalledWith('a', 'b', 'c');
    },
  );

  describe('the facade keeps no analytics bodies', () => {
    const facade = readSource('production.service.ts');

    it('no longer aggregates', () => {
      // `.aggregate(` and `.groupBy(` existed only inside this cluster.
      expect(facade).not.toContain('.aggregate(');
      expect(facade).not.toContain('.groupBy(');
    });

    it('delegates instead', () => {
      for (const method of ANALYTICS_METHODS) {
        expect(facade).toContain(`this.analytics.${method}(`);
      }
    });

    it('got smaller — under 2600 lines (was 3533)', () => {
      expect(facade.split('\n').length).toBeLessThan(2600);
    });

    it('still keeps the write path', () => {
      // The split must not have taken anything that mutates with it.
      //
      // `transitionBatchRecord` was in this list until Fase 3C part 3 moved the
      // batch-record cluster out; it is a delegator now, and `typeof` cannot
      // tell a delegator from a body, so leaving it here would have read as a
      // pass while asserting less. `startStage` replaces it. The batch-record
      // suite is the one that checks bodies, by fingerprint.
      for (const method of [
        'startProduction',
        'startStage',
        'submitStageLog',
        'issueMaterial',
        'createBatchSchedule',
        'updateScheduleResult',
        'verifyStageQC',
        'finalizeWorkOrderCosting',
      ]) {
        expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
          'function',
        );
      }
    });
  });

  describe('the extracted service', () => {
    const extracted = readSource('production-analytics.service.ts');

    it('carries the analytics logic', () => {
      expect(extracted).toContain('.aggregate(');
      expect(extracted).toContain('.groupBy(');
    });

    it('reads and does not write', () => {
      // The cluster measured as read-only. If a write ever migrates in here,
      // that is a design change that deserves its own decision, not a silent
      // side effect of a "read-model" service.
      for (const verb of [
        '.create(',
        '.update(',
        '.upsert(',
        '.delete(',
        '.createMany(',
        '.updateMany(',
        '.deleteMany(',
        '$transaction',
      ]) {
        expect(extracted).not.toContain(verb);
      }
    });

    it('depends on prisma and nothing else', () => {
      expect(extracted).toContain('private prisma: PrismaService');
      for (const dep of [
        'LegalityService',
        'EventEmitter2',
        'IdGeneratorService',
        'StateTransitionService',
      ]) {
        expect(extracted).not.toContain(dep);
      }
    });

    it('does not depend on ProductionService', () => {
      expect(extracted).not.toMatch(/from '\.\/production\.service'/);
      expect(extracted).not.toMatch(/extends\s+ProductionService/);
    });
  });

  it('is registered as a provider in production.module.ts', () => {
    const module = readSource('production.module.ts');
    expect(module).toContain('ProductionAnalyticsService');
  });
});
