/**
 * Fase 3C (part 5) — recording what actually happened leaves ProductionService.
 *
 * The four slices before this one were cut on mutability (analytics), on one
 * record type (batch records), and on deciding when work happens (planning).
 * This one is cut on *recording an outcome*: the two methods that take a
 * schedule that already exists and write down what it produced — actual output
 * quantity, actual per-step material consumption — plus the interlock gates
 * that refuse an impossible number before it is stored.
 *
 * Measured before the move, not assumed:
 *
 *   lines 914-1371 — two methods, contiguous, nothing interleaved
 *   `this.X` inside the block: prisma (2), eventEmitter (5), logger (1),
 *     idGenerator (1)
 *   zero references to either name anywhere else in the facade
 *   every method reaches the database through `tx` inside its own
 *     `$transaction` (2 of them) — which is why `this.prisma` counts 2 while
 *     the models touched number more
 *
 * The fingerprint list below is the one that would have failed the previous
 * slice. `STAGE_ORDER_VIOLATION` was disqualified there because the un-moved
 * code also contained it, so a "still present in the facade" assertion built on
 * it would have proved nothing. It is measurable here (inside 2, outside 0) but
 * is deliberately still absent from the list: nine strings that are provably
 * unique to this block do the job without re-using one that already needed an
 * explanation.
 *
 * The facade stays, for the same reason as the previous four slices: two
 * controller routes and six test modules should not have to change because a
 * file was split.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ProductionService } from '../../src/modules/production/production.service';
import { ProductionActualsService } from '../../src/modules/production/production-actuals.service';

/** The cluster, in file order. */
const ACTUALS_METHODS = ['updateScheduleResult', 'submitStepActuals'] as const;

/**
 * Strings that exist only inside the moved bodies — each measured at "inside 1,
 * outside 0" before the move. If any of these is still in the facade, a body did
 * not actually move.
 */
const BODY_FINGERPRINTS = [
  "'production.qc_interlock_triggered'",
  "'production.schedule_completed'",
  "'production.qc_gate_blocked'",
  "'production:finished-good-mirror'",
  'OUTPUT_EXCEEDS_PHYSICAL_LIMIT',
  'ARTWORK_NOT_APPROVED',
  'QC_BULK_NOT_PASSED',
  'MIXING QC not passed',
  "'Schedule not found'",
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
const buildFacade = (actuals: unknown) =>
  new ProductionService(
    {} as never, // prisma
    {} as never, // eventEmitter
    {} as never, // idGenerator
    {} as never, // analytics
    {} as never, // batchRecords
    {} as never, // planning
    actuals as never, // actuals
    {} as never, // execution
  );

describe('Fase 3C — schedule actuals live in their own service', () => {
  it('ProductionActualsService declares both methods', () => {
    for (const method of ACTUALS_METHODS) {
      expect(typeof methodsOf(ProductionActualsService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it('ProductionService still declares both (the facade is intact)', () => {
    for (const method of ACTUALS_METHODS) {
      expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it.each(ACTUALS_METHODS)(
    'ProductionService.%s forwards to ProductionActualsService exactly once',
    async (method) => {
      const actuals = Object.fromEntries(
        ACTUALS_METHODS.map((m) => [m, jest.fn().mockResolvedValue('delegated')]),
      );
      const service = buildFacade(actuals);
      const call = methodsOf(service);

      const result = await call[method].call(service);

      expect(result).toBe('delegated');
      expect(actuals[method]).toHaveBeenCalledTimes(1);
    },
  );

  it.each(ACTUALS_METHODS)(
    'ProductionService.%s forwards its arguments unchanged',
    async (method) => {
      const actuals = Object.fromEntries(
        ACTUALS_METHODS.map((m) => [m, jest.fn().mockResolvedValue('delegated')]),
      );
      const service = buildFacade(actuals);
      const call = methodsOf(service);

      await call[method].call(service, 'a', 'b', 'c');

      expect(actuals[method]).toHaveBeenCalledWith('a', 'b', 'c');
    },
  );

  describe('the facade keeps no actuals bodies', () => {
    const facade = readSource('production.service.ts');

    it.each(BODY_FINGERPRINTS)('no longer contains %s', (fingerprint) => {
      expect(facade).not.toContain(fingerprint);
    });

    it('delegates instead', () => {
      for (const method of ACTUALS_METHODS) {
        expect(facade).toContain(`this.actuals.${method}(`);
      }
    });

    it('got smaller — under 1250 lines (was 1649)', () => {
      expect(facade.split('\n').length).toBeLessThan(1250);
    });

    it('keeps the stage-execution path, which this split did not touch', () => {
      for (const method of [
        'startProduction',
        'startStage',
        'reportBreakdown',
        'submitStageLog',
      ]) {
        expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
          'function',
        );
        expect(facade).toContain(`${method}(`);
      }
    });
  });

  describe('the extracted service', () => {
    const extracted = readSource('production-actuals.service.ts');

    it('carries the actuals logic', () => {
      for (const fingerprint of BODY_FINGERPRINTS) {
        expect(extracted).toContain(fingerprint);
      }
    });

    it('depends on prisma, the event emitter and the id generator, nothing else', () => {
      expect(extracted).toContain('private prisma: PrismaService');
      expect(extracted).toContain('private eventEmitter: EventEmitter2');
      expect(extracted).toContain('private idGenerator: IdGeneratorService');
      // it keeps its own logger: one best-effort mirror lives in here, and a
      // service that cannot log its own failures would have to stay fused.
      expect(extracted).toContain('new Logger(');
      expect(extracted).toContain('logBestEffort');
      for (const dep of [
        'LegalityService',
        'StateTransitionService',
        'ProductionAnalyticsService',
        'ProductionBatchRecordService',
        'ProductionPlanningService',
      ]) {
        expect(extracted).not.toContain(dep);
      }
    });

    it('does not depend on ProductionService', () => {
      expect(extracted).not.toMatch(/from '\.\/production\.service'/);
      expect(extracted).not.toMatch(/extends\s+ProductionService/);
    });

    it('owns the schedule it records, and not another cluster', () => {
      // Measured inside the moved block before this assertion was written:
      // productionSchedule (6), finishedGood (3), productionStepDetail (3),
      // productionLog (2), materialInventory (2), requisitionFulfillment (2),
      // qCAudit (1), workOrder (1), user (1).
      //
      // Note `productionLog`, not `productionStepLog` — the first draft of this
      // list guessed the name and would have been the same kind of wrong
      // assertion the batch-record suite had to rewrite before its move. The
      // model is named what it is named.
      //
      // `workOrder` and `user` are not foreign: they are what an actual is
      // recorded *against* (which work order the schedule belongs to, who ran
      // it). What would break the claim is a different cluster's state moving
      // in — plan, sales order, requisitions, machines. None of that did.
      for (const owned of [
        'tx.productionSchedule.',
        'tx.productionStepDetail.',
        'tx.productionLog.',
        'tx.materialInventory.',
        'tx.requisitionFulfillment.',
        'tx.finishedGood.',
        'tx.qCAudit.',
      ]) {
        expect(extracted).toContain(owned);
      }
      for (const foreign of [
        'tx.productionPlan.',
        'tx.salesOrder.',
        'tx.materialRequisition.',
        'tx.machine.',
      ]) {
        expect(extracted).not.toContain(foreign);
      }
    });
  });

  it('is registered as a provider in production.module.ts', () => {
    const module = readSource('production.module.ts');
    expect(module).toContain('ProductionActualsService');
  });
});
