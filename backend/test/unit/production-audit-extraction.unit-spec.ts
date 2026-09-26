/**
 * Fase 3C (part 7) — the QC audit queue leaves ProductionService.
 *
 * The six slices before this one were cut on mutability (analytics), one record
 * type (batch records), deciding when work happens (planning), recording an
 * outcome (actuals), and the floor itself (execution). This one is cut on *the
 * decision a supervisor makes*: the queue of logs waiting for inspection, the
 * write that closes an inspection, and the stage calculator that says where the
 * batch goes next.
 *
 * Measured before the move, not assumed:
 *
 *   lines 292-398 — three methods, contiguous, nothing interleaved
 *   `this.X` inside the block: prisma (4), calculateNextStage (1, moving)
 *   zero references to any of the three names anywhere else in the facade
 *   one `this.prisma.$transaction`, inside `submitAudit` — the audit row and the
 *     log status are written together or not at all
 *
 * The third method is the interesting one. `calculateNextStage` is private and
 * is called from exactly one place (inside `submitAudit`), so it leaves with the
 * block and keeps **no** delegator on the facade. That is what the "dropped it
 * entirely" test below asserts: a delegator for it would be dead code, and this
 * slice's job is to remove wiring, not add it.
 *
 * This is also the first extracted service that needs one collaborator: no event
 * emitter, no id generator, no logger. The block neither emits nor logs.
 *
 * The facade stays, for the same reason as the previous six slices: the
 * controller routes and six test modules should not have to change because a
 * file was split.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ProductionService } from '../../src/modules/production/production.service';
import { ProductionAuditService } from '../../src/modules/production/production-audit.service';

/** The two methods that keep a delegator on the facade. */
const AUDIT_METHODS = ['getPendingAudits', 'submitAudit'] as const;

/** The private helper that leaves entirely — no delegator, by measurement. */
const MOVED_PRIVATE = 'calculateNextStage';

/**
 * Strings that exist only inside the moved bodies — each measured at "inside 1+,
 * outside 0" before the move. If any of these is still in the facade, a body did
 * not actually move.
 */
const BODY_FINGERPRINTS = [
  'PENDING_QC',
  'QC_REQUIRED',
  'Log entry not found',
  'MIXING',
  'FILLING',
  'PACKING',
  'REJECT',
  'REWORK',
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
const buildFacade = (audit: unknown) =>
  new ProductionService(
    {} as never, // prisma
    {} as never, // eventEmitter
    {} as never, // idGenerator
    {} as never, // analytics
    {} as never, // batchRecords
    {} as never, // planning
    {} as never, // actuals
    {} as never, // execution
    audit as never,
    {} as never, // machines
    {} as never, // qrContexts
    {} as never, // workOrders
  );

describe('Fase 3C — the QC audit queue lives in its own service', () => {
  it('ProductionAuditService declares the two public methods and the calculator', () => {
    for (const method of [...AUDIT_METHODS, MOVED_PRIVATE]) {
      expect(typeof methodsOf(ProductionAuditService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it('ProductionService still declares both public ones (the facade is intact)', () => {
    for (const method of AUDIT_METHODS) {
      expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it.each(AUDIT_METHODS)(
    'ProductionService.%s forwards to ProductionAuditService exactly once',
    async (method) => {
      const audit = Object.fromEntries(
        AUDIT_METHODS.map((m) => [m, jest.fn().mockResolvedValue('delegated')]),
      );
      const service = buildFacade(audit);
      const call = methodsOf(service);

      const result = await call[method].call(service);

      expect(result).toBe('delegated');
      expect(audit[method]).toHaveBeenCalledTimes(1);
    },
  );

  it.each(AUDIT_METHODS)(
    'ProductionService.%s forwards its arguments unchanged',
    async (method) => {
      const audit = Object.fromEntries(
        AUDIT_METHODS.map((m) => [m, jest.fn().mockResolvedValue('delegated')]),
      );
      const service = buildFacade(audit);
      const call = methodsOf(service);

      await call[method].call(service, 'a', 'b', 'c');

      expect(audit[method]).toHaveBeenCalledWith('a', 'b', 'c');
    },
  );

  describe('the facade keeps no audit bodies', () => {
    const facade = readSource('production.service.ts');

    it.each(BODY_FINGERPRINTS)('no longer contains %s', (fingerprint) => {
      expect(facade).not.toContain(fingerprint);
    });

    it('delegates instead', () => {
      for (const method of AUDIT_METHODS) {
        expect(facade).toContain(`this.audit.${method}(`);
      }
    });

    it('got smaller — under 780 lines (was 830)', () => {
      expect(facade.split('\n').length).toBeLessThan(780);
    });

    it('dropped the private stage calculator entirely, delegator included', () => {
      // Zero callers outside the block, so a delegator would be dead code.
      expect(facade).not.toContain(MOVED_PRIVATE);
      expect(methodsOf(ProductionService.prototype)[MOVED_PRIVATE]).toBeUndefined();
    });

    it('keeps the paths this split did not touch', () => {
      for (const method of [
        'createMachine',
        'getMachines',
        'getActiveMachines',
        'getAllRequisitions',
        'resolveQRContext',
        'verifyStageQC',
        'finalizeWorkOrderCosting',
        'createWorkOrder',
        'issueMaterial',
        'flagShortage',
      ]) {
        expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
          'function',
        );
        expect(facade).toContain(`${method}(`);
      }
    });
  });

  describe('the extracted service', () => {
    const extracted = readSource('production-audit.service.ts');

    it('carries the audit logic, including the private calculator', () => {
      for (const fingerprint of BODY_FINGERPRINTS) {
        expect(extracted).toContain(fingerprint);
      }
      expect(extracted).toContain(`${MOVED_PRIVATE}(`);
      expect(extracted).toContain('private prisma: PrismaService');
    });

    it('depends on prisma alone', () => {
      for (const dep of [
        'EventEmitter2',
        'IdGeneratorService',
        'LegalityService',
        'StateTransitionService',
        'Logger',
        'ProductionAnalyticsService',
        'ProductionBatchRecordService',
        'ProductionPlanningService',
        'ProductionActualsService',
        'ProductionExecutionService',
      ]) {
        expect(extracted).not.toContain(dep);
      }
    });

    it('does not depend on ProductionService', () => {
      expect(extracted).not.toMatch(/from '\.\/production\.service'/);
      expect(extracted).not.toMatch(/extends\s+ProductionService/);
    });

    it('owns the audit queue, and not another cluster', () => {
      // Measured inside the moved block before this assertion was written:
      // outside the transaction — productionLog (1), workOrder (1),
      // productionStepLog (1); inside it — workOrder (3), productionLog (1),
      // qCAudit (1). Model names are copied from the measured census, not
      // guessed: an earlier suite in this series had to rewrite exactly this
      // kind of assertion because the name was assumed.
      for (const owned of [
        'this.prisma.productionLog.',
        'this.prisma.workOrder.',
        'this.prisma.productionStepLog.',
        'tx.productionLog.',
        'tx.workOrder.',
        'tx.qCAudit.',
      ]) {
        expect(extracted).toContain(owned);
      }
      for (const foreign of [
        'prisma.machine.',
        'prisma.materialRequisition.',
        'prisma.warehouseInbound.',
        'prisma.materialInventory.',
        'prisma.productionPlan.',
      ]) {
        expect(extracted).not.toContain(foreign);
      }
    });

    it('keeps the one transaction that makes the audit atomic', () => {
      expect(extracted).toContain('this.prisma.$transaction');
    });
  });

  it('is registered as a provider in production.module.ts', () => {
    const module = readSource('production.module.ts');
    expect(module).toContain('ProductionAuditService');
  });
});
