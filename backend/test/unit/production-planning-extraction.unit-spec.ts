/**
 * Fase 3C (part 4) — production planning left ProductionService.
 *
 * The fourth slice, and the first that cuts through the write path in a domain
 * sense rather than a mechanical one: these six methods are the only place that
 * decides *when* work happens. Everything before this moved either reads
 * (analytics) or one self-contained record type (batch records).
 *
 * Measured before the move, not assumed:
 *
 *   lines 883-1391 — six methods, contiguous, nothing interleaved
 *   `this.X` inside the block: `prisma` (6), `eventEmitter` (5), `idGenerator` (1)
 *   zero references to any of the six names elsewhere in the facade
 *   zero calls from the block to another ProductionService method
 *   the only real caller is production.controller.ts
 *
 * The block reaches the database mostly through `tx` inside `$transaction`
 * (four of them), not through `this.prisma` — which is why `this.prisma` counts
 * six while the models touched number ten. The transaction client is a
 * parameter of the callback, so it needs no injection; only the outer
 * `$transaction` does.
 *
 * The name is the one the architecture plan itself proposed
 * (ProductionPlanningService). The facade stays, as in the previous three
 * slices, so controller routes and the six test modules that build a
 * ProductionService did not have to change because a file was split.
 *
 * Red-first: this suite could not collect until the module existed, and the
 * body fingerprints below were absent-by-construction until the bodies moved.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ProductionService } from '../../src/modules/production/production.service';
import { ProductionPlanningService } from '../../src/modules/production/production-planning.service';

/** The cluster, in file order. */
const PLANNING_METHODS = [
  'createBatchSchedule',
  'rescheduleBatchSchedule',
  'dispatchWorkOrder',
  'checkMaterialReadiness',
  'createWorkOrderFromSO',
  'getSchedulesByStage',
] as const;

/**
 * Strings that exist only inside the moved bodies. If any of these is still in
 * the facade, a body did not actually move.
 *
 * `STAGE_ORDER_VIOLATION` was in this list until the extractor rejected it: it
 * also appears in a method that stays behind, so it cannot prove a move.
 * A fingerprint that the un-moved code shares is not a fingerprint.
 */
const BODY_FINGERPRINTS = [
  "'production.schedule.created'",
  "'production.schedule.rescheduled'",
  "'production.workorder.dispatched'",
  'SCHEDULE_COLLISION',
  'MACHINE_CAPACITY_EXCEEDED',
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
const buildFacade = (planning: unknown) =>
  new ProductionService(
    {} as never, // prisma
    {} as never, // legality
    {} as never, // eventEmitter
    {} as never, // idGenerator
    {} as never, // stateTransition
    {} as never, // analytics
    {} as never, // batchRecords
    planning as never,
  );

describe('Fase 3C — production planning lives in its own service', () => {
  it('ProductionPlanningService declares all six methods', () => {
    for (const method of PLANNING_METHODS) {
      expect(typeof methodsOf(ProductionPlanningService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it('ProductionService still declares all six (the facade is intact)', () => {
    for (const method of PLANNING_METHODS) {
      expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it.each(PLANNING_METHODS)(
    'ProductionService.%s forwards to ProductionPlanningService exactly once',
    async (method) => {
      const planning = Object.fromEntries(
        PLANNING_METHODS.map((m) => [m, jest.fn().mockResolvedValue('delegated')]),
      );
      const service = buildFacade(planning);
      const call = methodsOf(service);

      const result = await call[method].call(service);

      expect(result).toBe('delegated');
      expect(planning[method]).toHaveBeenCalledTimes(1);
    },
  );

  it.each(PLANNING_METHODS)(
    'ProductionService.%s forwards its arguments unchanged',
    async (method) => {
      const planning = Object.fromEntries(
        PLANNING_METHODS.map((m) => [m, jest.fn().mockResolvedValue('delegated')]),
      );
      const service = buildFacade(planning);
      const call = methodsOf(service);

      await call[method].call(service, 'a', 'b', 'c');

      expect(planning[method]).toHaveBeenCalledWith('a', 'b', 'c');
    },
  );

  describe('the facade keeps no planning bodies', () => {
    const facade = readSource('production.service.ts');

    it.each(BODY_FINGERPRINTS)('no longer contains %s', (fingerprint) => {
      expect(facade).not.toContain(fingerprint);
    });

    it('delegates instead', () => {
      for (const method of PLANNING_METHODS) {
        expect(facade).toContain(`this.planning.${method}(`);
      }
    });

    it('got smaller — under 1700 lines (was 2128)', () => {
      expect(facade.split('\n').length).toBeLessThan(1700);
    });

    it('keeps the stage-execution path, which this split did not touch', () => {
      for (const method of [
        'startProduction',
        'startStage',
        'submitStageLog',
        'submitStepActuals',
        'updateScheduleResult',
        'verifyStageQC',
        'finalizeWorkOrderCosting',
      ]) {
        expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
          'function',
        );
        // and the body, not just a delegator: these must still be real code
        expect(facade).toContain(`${method}(`);
      }
    });
  });

  describe('the extracted service', () => {
    const extracted = readSource('production-planning.service.ts');

    it('carries the planning logic', () => {
      for (const fingerprint of BODY_FINGERPRINTS) {
        expect(extracted).toContain(fingerprint);
      }
    });

    it('depends on prisma, the id generator and the emitter, and nothing else', () => {
      expect(extracted).toContain('private prisma: PrismaService');
      expect(extracted).toContain('private eventEmitter: EventEmitter2');
      expect(extracted).toContain('private idGenerator: IdGeneratorService');
      for (const dep of [
        'LegalityService',
        'StateTransitionService',
        'ProductionAnalyticsService',
        'ProductionBatchRecordService',
      ]) {
        expect(extracted).not.toContain(dep);
      }
    });

    it('does not depend on ProductionService', () => {
      expect(extracted).not.toMatch(/from '\.\/production\.service'/);
      expect(extracted).not.toMatch(/extends\s+ProductionService/);
    });

    it('keeps the batch-record and analytics fingerprints out', () => {
      // Two earlier slices own these. A planning file that starts emitting
      // batch-record events means the seams overlapped.
      for (const foreign of [
        "'production.batch_record.created'",
        "'production.batch_record.transitioned'",
        'this.analytics.',
      ]) {
        expect(extracted).not.toContain(foreign);
      }
    });
  });

  it('is registered as a provider in production.module.ts', () => {
    const module = readSource('production.module.ts');
    expect(module).toContain('ProductionPlanningService');
  });
});
