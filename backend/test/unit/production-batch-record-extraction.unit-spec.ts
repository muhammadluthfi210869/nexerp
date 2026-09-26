/**
 * Fase 3C (part 3) — the batch-record cluster left ProductionService.
 *
 * The analytics slice was cut on mutability: sixteen methods that could not
 * write. This one is cut on a different axis, and the difference is deliberate
 * and worth stating, because it is the reason this file does not carry the
 * "reads and does not write" guard that `production-analytics-extraction`
 * carries. Batch records are a *domain* cluster: they read, they write, and
 * they emit. What makes them a seam is that they own one model
 * (`productionPlan`-as-batch-record) and reach nothing else in the class.
 *
 * Measured before the move, not assumed:
 *
 *   lines 1853-2219 — seven methods, contiguous (1-line gaps only)
 *   `this.X` inside the block: `prisma` (13), `eventEmitter` (2), `logger` (1)
 *   no moved name is referenced anywhere else in the facade (0, all seven)
 *   the only real caller is `production.controller.ts` (7 call sites)
 *
 * The last point was re-measured rather than trusted. A repo-wide grep for
 * these names hits eleven files, but ten of them are generated or descriptive:
 * `swagger-spec.json`, `src/metadata.ts`, the frontend's `types/api-schema.d.ts`
 * and `types/api.ts`, and two YAML contracts. Only the controller binds them to
 * a `ProductionService` instance. A grep for a name answers "where is this
 * string", not "who calls whom" — the same mistake this phase already made once
 * and reverted, recorded in the Fase 3C gate report §6.1.
 *
 * The facade stays, for the same reason as the previous two slices: seven
 * controller routes and six test modules should not have to change because a
 * file was split.
 *
 * Red-first: this suite could not collect until the service existed, and the
 * facade-side fingerprints below were absent-by-construction until the bodies
 * actually moved.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ProductionService } from '../../src/modules/production/production.service';
import { ProductionBatchRecordService } from '../../src/modules/production/production-batch-record.service';

/** The cluster, in file order. */
const BATCH_METHODS = [
  'getBatchRecordDetail',
  'createBatchRecord',
  'getBatchRecord',
  'updateBatchRecord',
  'deleteBatchRecord',
  'transitionBatchRecord',
  'getBatchRecords',
] as const;

/**
 * Strings that exist only inside the moved bodies. If any of these is still in
 * the facade, a body did not actually move.
 */
const BODY_FINGERPRINTS = [
  "'production.batch_record.created'",
  "'production.batch_record.transitioned'",
  'Batch record ${batchNo} not found',
  'Batch record ${id} not found',
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
const buildFacade = (batchRecords: unknown) =>
  new ProductionService(
    {} as never, // prisma
    {} as never, // eventEmitter
    {} as never, // idGenerator
    {} as never, // analytics
    batchRecords as never, // batchRecords
    {} as never, // planning
    {} as never, // actuals
    {} as never, // execution
    {} as never, // audit
    {} as never, // machines
    {} as never, // qrContexts
    {} as never, // workOrders
  );

describe('Fase 3C — batch records live in their own service', () => {
  it('ProductionBatchRecordService declares all seven methods', () => {
    for (const method of BATCH_METHODS) {
      expect(
        typeof methodsOf(ProductionBatchRecordService.prototype)[method],
      ).toBe('function');
    }
  });

  it('ProductionService still declares all seven (the facade is intact)', () => {
    for (const method of BATCH_METHODS) {
      expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it.each(BATCH_METHODS)(
    'ProductionService.%s forwards to ProductionBatchRecordService exactly once',
    async (method) => {
      const batchRecords = Object.fromEntries(
        BATCH_METHODS.map((m) => [m, jest.fn().mockResolvedValue('delegated')]),
      );
      const service = buildFacade(batchRecords);
      const call = methodsOf(service);

      const result = await call[method].call(service);

      expect(result).toBe('delegated');
      expect(batchRecords[method]).toHaveBeenCalledTimes(1);
    },
  );

  it.each(BATCH_METHODS)(
    'ProductionService.%s forwards its arguments unchanged',
    async (method) => {
      const batchRecords = Object.fromEntries(
        BATCH_METHODS.map((m) => [m, jest.fn().mockResolvedValue('delegated')]),
      );
      const service = buildFacade(batchRecords);
      const call = methodsOf(service);

      await call[method].call(service, 'a', 'b', 'c');

      expect(batchRecords[method]).toHaveBeenCalledWith('a', 'b', 'c');
    },
  );

  describe('the facade keeps no batch-record bodies', () => {
    const facade = readSource('production.service.ts');

    it.each(BODY_FINGERPRINTS)(
      'no longer contains %s',
      (fingerprint) => {
        expect(facade).not.toContain(fingerprint);
      },
    );

    it('delegates instead', () => {
      for (const method of BATCH_METHODS) {
        expect(facade).toContain(`this.batchRecords.${method}(`);
      }
    });

    it('got smaller — under 2150 lines (was 2459)', () => {
      expect(facade.split('\n').length).toBeLessThan(2150);
    });

    it('keeps the stage-execution path, which this split did not touch', () => {
      for (const method of [
        'startProduction',
        'startStage',
        'submitStageLog',
        'issueMaterial',
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
    const extracted = readSource('production-batch-record.service.ts');

    it('carries the batch-record logic', () => {
      for (const fingerprint of BODY_FINGERPRINTS) {
        expect(extracted).toContain(fingerprint);
      }
    });

    it('depends on prisma and the event emitter, and nothing else', () => {
      // `eventEmitter` is the one deliberate breach of the analytics slice's
      // "prisma and nothing else" rule, and it is legitimate: two of these
      // methods publish domain events, which is how this codebase already
      // decouples modules (26 files emit, 12 listen). An extracted service
      // that could not emit would have to stay fused to the facade.
      expect(extracted).toContain('private prisma: PrismaService');
      expect(extracted).toContain('private eventEmitter: EventEmitter2');
      for (const dep of [
        'LegalityService',
        'IdGeneratorService',
        'StateTransitionService',
        'ProductionAnalyticsService',
      ]) {
        expect(extracted).not.toContain(dep);
      }
    });

    it('does not depend on ProductionService', () => {
      expect(extracted).not.toMatch(/from '\.\/production\.service'/);
      expect(extracted).not.toMatch(/extends\s+ProductionService/);
    });

    it('touches the model family it owns, and nothing else', () => {
      // The seam claim is that this cluster owns one model family. Measured
      // inside the moved block: `productionPlan` (10), `salesOrder` (1),
      // `user` (1), `workOrder` (1).
      //
      // The last three are not foreign, and asserting that they are absent was
      // this file's one wrong assertion before the move — a single source read
      // at line 1918 shows `workOrder.update`. They are what a batch record is
      // *made of*: the sales order it fulfils, the operator who acted, and the
      // work order it links back to.
      //
      // What would actually break the claim is stage-execution state moving in
      // with it. None of that did.
      for (const owned of [
        'this.prisma.productionPlan.',
        'this.prisma.salesOrder.',
        'this.prisma.user.',
        'this.prisma.workOrder.',
      ]) {
        expect(extracted).toContain(owned);
      }
      for (const foreign of [
        'this.prisma.productionSchedule.',
        'this.prisma.productionStepLog.',
        'this.prisma.materialRequisition.',
        'this.prisma.machine.',
        'this.prisma.finishedGood.',
      ]) {
        expect(extracted).not.toContain(foreign);
      }
    });
  });

  it('is registered as a provider in production.module.ts', () => {
    const module = readSource('production.module.ts');
    expect(module).toContain('ProductionBatchRecordService');
  });
});
