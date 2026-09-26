/**
 * Fase 3C (part 6) — stage execution leaves ProductionService.
 *
 * This is the slice the refactor plan named from the start
 * (`ProductionExecutionService`), and the first one that is not a single
 * contiguous range: the four execution methods sit at lines 42-350 and
 * `calculateCOPQ`, which they call, sits alone at 814-881.
 *
 * A two-range move is only safe because of a measurement, not a guess:
 * `calculateCOPQ` is referenced exactly once outside its own body — at line 293,
 * inside `submitStageLog`. Once both move, neither name exists in the facade.
 * Had there been a second caller further down, this slice would have had to
 * either carry that caller too or leave `calculateCOPQ` behind.
 *
 * Measured before the move, not assumed:
 *
 *   ranges 42-350 and 814-881 — five methods, nothing else inside either range
 *   `this.X` inside: prisma (6), idGenerator (3), eventEmitter (6),
 *     legality (1), stateTransition (1), and `calculateCOPQ` (1, self, moving)
 *   zero references to any of the five names outside the ranges
 *   no Logger use at all — this service does not log, so it gets no logger
 *
 * The move also empties two constructor parameters. `legality` and
 * `stateTransition` are used by `submitStageLog` and by nothing else in the
 * 1200-line facade, so they travel with the code instead of staying behind as
 * dead wiring. That is why `buildFacade` below grew an argument and *shrank*
 * from nine to eight.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ProductionService } from '../../src/modules/production/production.service';
import { ProductionExecutionService } from '../../src/modules/production/production-execution.service';

/** The cluster, in file order. */
const EXECUTION_METHODS = [
  'startProduction',
  'startStage',
  'reportBreakdown',
  'submitStageLog',
  'calculateCOPQ',
] as const;

/**
 * Strings that exist only inside the moved bodies — each measured at "inside 1,
 * outside 0" before the move. The last two come from `calculateCOPQ` itself,
 * which is what makes them worth carrying: they prove the out-of-range method
 * moved too, not just the four contiguous ones.
 */
const BODY_FINGERPRINTS = [
  "'production.work_order.started'",
  "'production.breakdown.reported'",
  "'production.stage.completed'",
  "'SYSTEM: PRODUCTION_STARTED_OEE_ACTIVE'",
  "'Warehouse has not fully released materials yet (Handover Lock)'",
  "'Invalid Work Order ID format'",
  '`[COPQ_ENGINE] Calculating loss for WO: ${workOrderId} at ${stage}`',
  '`REJECT_${rejectQty}_AT_${stage}`',
];

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
const buildFacade = (execution: unknown) =>
  new ProductionService(
    {} as never, // prisma
    {} as never, // eventEmitter
    {} as never, // idGenerator
    {} as never, // analytics
    {} as never, // batchRecords
    {} as never, // planning
    {} as never, // actuals
    execution as never,
    {} as never, // audit,
    {} as never, // machines
    {} as never, // qrContexts
  );

describe('Fase 3C — stage execution lives in its own service', () => {
  it('ProductionExecutionService declares all five methods', () => {
    for (const method of EXECUTION_METHODS) {
      expect(
        typeof methodsOf(ProductionExecutionService.prototype)[method],
      ).toBe('function');
    }
  });

  it('ProductionService still declares all five (the facade is intact)', () => {
    for (const method of EXECUTION_METHODS) {
      expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it.each(EXECUTION_METHODS)(
    'ProductionService.%s forwards to ProductionExecutionService exactly once',
    async (method) => {
      const execution = Object.fromEntries(
        EXECUTION_METHODS.map((m) => [
          m,
          jest.fn().mockResolvedValue('delegated'),
        ]),
      );
      const service = buildFacade(execution);
      const call = methodsOf(service);

      const result = await call[method].call(service);

      expect(result).toBe('delegated');
      expect(execution[method]).toHaveBeenCalledTimes(1);
    },
  );

  it.each(EXECUTION_METHODS)(
    'ProductionService.%s forwards its arguments unchanged',
    async (method) => {
      const execution = Object.fromEntries(
        EXECUTION_METHODS.map((m) => [
          m,
          jest.fn().mockResolvedValue('delegated'),
        ]),
      );
      const service = buildFacade(execution);
      const call = methodsOf(service);

      await call[method].call(service, 'a', 'b', 'c');

      expect(execution[method]).toHaveBeenCalledWith('a', 'b', 'c');
    },
  );

  describe('the facade keeps no execution bodies', () => {
    const facade = readSource('production.service.ts');

    it.each(BODY_FINGERPRINTS)('no longer contains %s', (fingerprint) => {
      expect(facade).not.toContain(fingerprint);
    });

    it('delegates instead', () => {
      for (const method of EXECUTION_METHODS) {
        expect(facade).toContain(`this.execution.${method}(`);
      }
    });

    it('got smaller — under 880 lines (was 1200)', () => {
      expect(facade.split('\n').length).toBeLessThan(880);
    });

    it('no longer injects the collaborators only this code used', () => {
      // The move took the last two users of these with it. Leaving the
      // parameters behind would be dead wiring, so this asserts their absence
      // rather than tolerating it.
      expect(facade).not.toContain('LegalityService');
      expect(facade).not.toContain('StateTransitionService');
    });

    it('keeps the paths this split did not touch', () => {
      for (const method of [
        'issueMaterial',
        'flagShortage',
        'verifyStageQC',
        'finalizeWorkOrderCosting',
        'getPendingAudits',
        'submitAudit',
        'resolveQRContext',
      ]) {
        expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
          'function',
        );
        expect(facade).toContain(`${method}(`);
      }
    });
  });

  describe('the extracted service', () => {
    const extracted = readSource('production-execution.service.ts');

    it('carries the execution logic, including the out-of-range method', () => {
      for (const fingerprint of BODY_FINGERPRINTS) {
        expect(extracted).toContain(fingerprint);
      }
      expect(extracted).toContain('calculateCOPQ(');
    });

    it('depends on exactly the five collaborators the block used', () => {
      for (const dep of [
        'private prisma: PrismaService',
        'private legality: LegalityService',
        'private stateTransition: StateTransitionService',
        'private idGenerator: IdGeneratorService',
        'private eventEmitter: EventEmitter2',
      ]) {
        expect(extracted).toContain(dep);
      }
      for (const dep of [
        'ProductionAnalyticsService',
        'ProductionBatchRecordService',
        'ProductionPlanningService',
        'ProductionActualsService',
      ]) {
        expect(extracted).not.toContain(dep);
      }
    });

    it('does not depend on ProductionService', () => {
      expect(extracted).not.toMatch(/from '\.\/production\.service'/);
      expect(extracted).not.toMatch(/extends\s+ProductionService/);
    });

    it('owns the execution record, and not another cluster', () => {
      // Measured inside the moved ranges: workOrder (5), productionLog (5),
      // machine (4), productionPlan (1, a read of the plan the WO belongs to),
      // cOPQRecord (1).
      for (const owned of [
        'tx.workOrder.',
        'tx.productionLog.',
        'tx.machine.',
        'tx.cOPQRecord.',
      ]) {
        expect(extracted).toContain(owned);
      }
      for (const foreign of [
        'tx.productionSchedule.',
        'tx.materialInventory.',
        'tx.finishedGood.',
        'tx.requisitionFulfillment.',
        'tx.qcAudit.',
        'tx.salesOrder.',
      ]) {
        expect(extracted).not.toContain(foreign);
      }
    });
  });

  it('is registered as a provider in production.module.ts', () => {
    const module = readSource('production.module.ts');
    expect(module).toContain('ProductionExecutionService');
  });
});
