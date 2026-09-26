/**
 * Fase 3C (part 8) — the machine registry and the QR scan resolver leave
 * ProductionService.
 *
 * Two destinations in one slice, because the two questions are different ones:
 * which machines exist (and are free) is the floor's asset registry; what a
 * scanned QR points at is QC intake fanned out across production, warehouse and
 * material master. Filing either inside the other would have made one of them
 * the odd one out.
 *
 * Measured before the move, not assumed:
 *
 *   ranges 310-312 and 328-346 — three machine methods, prisma and nothing else
 *   range 347-417 — resolveQRContext, 71 lines, one prisma call per branch
 *   \`getAllRequisitions\` (314-326) sits between the two ranges and did NOT move:
 *     it is the material requisition list, the same resource \`issueMaterial\` and
 *     \`flagShortage\` write to, so it leaves with that cluster instead. The test
 *     "left the requisition list behind" below pins that boundary decision.
 *   zero references to any of the four names anywhere else in the facade
 *
 * The machine methods have no string literals of their own — they are pure
 * prisma calls — so their tests assert on query shapes (still absent from the
 * facade, present in the new service) rather than on messages.
 *
 * §14.1 also records a finding this slice only moved around: \`createMachine\` and
 * \`getActiveMachines\` have no route and no caller anywhere. They are moved, not
 * deleted, and the last test here is what would notice if a route appears.
 *
 * The facade stays: production.controller.ts:24 calls \`getMachines\`, and two
 * frontend screens call that route.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ProductionService } from '../../src/modules/production/production.service';
import { ProductionMachineService } from '../../src/modules/production/production-machine.service';
import { ProductionQrContextService } from '../../src/modules/production/production-qr-context.service';

/** Machine registry, in file order. */
const MACHINE_METHODS = ['createMachine', 'getMachines', 'getActiveMachines'] as const;

/** The QR resolver, its own service. */
const QR_METHOD = 'resolveQRContext';

const ALL_MOVED = [...MACHINE_METHODS, QR_METHOD];

/**
 * Strings that exist only inside the moved bodies — each measured at "inside 1,
 * outside 0" before the move. The machine ones are query shapes, because those
 * bodies have no messages of their own.
 */
const MACHINE_FINGERPRINTS = [
  'this.prisma.machine.create({ data: dto })',
  'where: category ? { type: category as any } : {}',
  'where: { isActive: true }',
  'goodQty: 0, rejectQty: 0',
];

const QR_FINGERPRINTS = [
  'PRODUCTION_QC',
  'INBOUND_QC',
  'MATERIAL_QC',
  'MANUAL_MODE',
  'Context Not Found',
  'QC Kedatangan Barang',
  'QC Material: ${inventory.material.name}',
  'QC Produksi: ${plan.batchNo}',
  'QC Tahap: ${log.stage}',
  'QR Code tidak terdaftar. Masuk ke mode manual?',
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
const buildFacade = (machines: unknown, qrContexts: unknown) =>
  new ProductionService(
    {} as never, // prisma
    {} as never, // eventEmitter
    {} as never, // idGenerator
    {} as never, // analytics
    {} as never, // batchRecords
    {} as never, // planning
    {} as never, // actuals
    {} as never, // execution
    {} as never, // audit
    machines as never,
    qrContexts as never,
    {} as never, // workOrders
  );

describe('Fase 3C — machines and QR scan resolution live in their own services', () => {
  it('ProductionMachineService declares all three machine methods', () => {
    for (const method of MACHINE_METHODS) {
      expect(typeof methodsOf(ProductionMachineService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it('ProductionQrContextService declares the resolver', () => {
    expect(
      typeof methodsOf(ProductionQrContextService.prototype)[QR_METHOD],
    ).toBe('function');
  });

  it('ProductionService still declares all four (the facade is intact)', () => {
    for (const method of ALL_MOVED) {
      expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it.each(MACHINE_METHODS)(
    'ProductionService.%s forwards to ProductionMachineService exactly once',
    async (method) => {
      const machines = Object.fromEntries(
        MACHINE_METHODS.map((m) => [m, jest.fn().mockResolvedValue('delegated')]),
      );
      const service = buildFacade(machines, {});
      const call = methodsOf(service);

      const result = await call[method].call(service, 'a', 'b');

      expect(result).toBe('delegated');
      expect(machines[method]).toHaveBeenCalledWith('a', 'b');
    },
  );

  it('ProductionService.resolveQRContext forwards to ProductionQrContextService', async () => {
    const qrContexts = { [QR_METHOD]: jest.fn().mockResolvedValue('delegated') };
    const service = buildFacade({}, qrContexts);
    const call = methodsOf(service);

    const result = await call[QR_METHOD].call(service, 'uuid-1');

    expect(result).toBe('delegated');
    expect(qrContexts[QR_METHOD]).toHaveBeenCalledWith('uuid-1');
  });

  describe('the facade keeps no machine or QR bodies', () => {
    const facade = readSource('production.service.ts');

    it.each([...MACHINE_FINGERPRINTS, ...QR_FINGERPRINTS])(
      'no longer contains %s',
      (fingerprint) => {
        expect(facade).not.toContain(fingerprint);
      },
    );

    it('has no machine query left at all', () => {
      expect(facade).not.toContain('this.prisma.machine.');
    });

    it('delegates instead', () => {
      for (const method of MACHINE_METHODS) {
        expect(facade).toContain(`this.machines.${method}(`);
      }
      expect(facade).toContain(`this.qrContexts.${QR_METHOD}(`);
    });

    it('got smaller — under 700 lines (was 740)', () => {
      expect(facade.split('\n').length).toBeLessThan(700);
    });

    it('did not move the requisition list into machines', () => {
      // It sits between the two machine ranges and did not move with machines: the same
      // resource issueMaterial and flagShortage write to (extracted in part 9).
      expect(typeof methodsOf(ProductionService.prototype)['getAllRequisitions']).toBe(
        'function',
      );
      expect(facade).not.toContain('this.machines.getAllRequisitions(');
    });

    it('keeps the paths this split did not touch', () => {
      for (const method of [
        'createWorkOrder',
        'issueMaterial',
        'flagShortage',
        'verifyStageQC',
        'returnMaterial',
        'finalizeWorkOrderCosting',
        'assignFormulaToPlan',
        'getFormulaAdjustments',
      ]) {
        expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
          'function',
        );
        expect(facade).toContain(`${method}(`);
      }
    });
  });

  describe('the extracted services', () => {
    const machine = readSource('production-machine.service.ts');
    const qr = readSource('production-qr-context.service.ts');

    it('carry the logic', () => {
      for (const fingerprint of MACHINE_FINGERPRINTS) {
        expect(machine).toContain(fingerprint);
      }
      for (const fingerprint of QR_FINGERPRINTS) {
        expect(qr).toContain(fingerprint);
      }
    });

    it('depend on prisma alone', () => {
      for (const source of [machine, qr]) {
        expect(source).toContain('private prisma: PrismaService');
        for (const dep of [
          'EventEmitter2',
          'IdGeneratorService',
          'LegalityService',
          'StateTransitionService',
          'Logger',
          'ProductionAnalyticsService',
        ]) {
          expect(source).not.toContain(dep);
        }
      }
    });

    it('do not depend on ProductionService', () => {
      // Named in prose by both headers, so the plain-substring check above would
      // be wrong here: what matters is the import and the inheritance, not the
      // mention.
      for (const source of [machine, qr]) {
        expect(source).not.toMatch(/from '\.\/production\.service'/);
        expect(source).not.toMatch(/extends\s+ProductionService/);
      }
    });

    it('do not depend on each other', () => {
      // Mentioned in prose header, so test class instantiation / imports, not header comments
      expect(machine).not.toMatch(/from '\.\/production-qr-context\.service'/);
      expect(machine).not.toMatch(/ProductionQrContextService\b/m);
      expect(qr).not.toMatch(/from '\.\/production-machine\.service'/);
      expect(qr).not.toContain('private machines: ProductionMachineService');
    });

    it('own one resource each', () => {
      // Measured before the move, not guessed: the machine range touches
      // `machine` three times and nothing else; the QR range reads four models,
      // one per branch.
      expect(machine).toContain('this.prisma.machine.');
      for (const foreign of [
        'prisma.productionLog.',
        'prisma.warehouseInbound.',
        'prisma.materialInventory.',
        'prisma.productionPlan.',
        'prisma.materialRequisition.',
      ]) {
        expect(machine).not.toContain(foreign);
      }
      for (const owned of [
        'prisma.productionLog.',
        'prisma.warehouseInbound.',
        'prisma.materialInventory.',
        'prisma.productionPlan.',
      ]) {
        expect(qr).toContain(owned);
      }
      expect(qr).not.toContain('prisma.machine.');
    });

    it('write nothing', () => {
      // resolveQRContext answers questions; the machine registry's one write is
      // createMachine, and it is not a transaction.
      expect(qr).not.toContain('.create(');
      expect(qr).not.toContain('.update(');
      expect(machine).not.toContain('$transaction');
      expect(qr).not.toContain('$transaction');
    });
  });

  it('is registered as providers in production.module.ts', () => {
    const module = readSource('production.module.ts');
    expect(module).toContain('ProductionMachineService');
    expect(module).toContain('ProductionQrContextService');
  });

  it('still has no route for two of the three machine methods (§14.1)', () => {
    // This is the finding the slice recorded instead of acting on. When a route
    // appears, this test fails — which is the moment the note in the machine
    // service header and §14.1 need revisiting.
    const controller = readSource('production.controller.ts');
    expect(controller).toContain('this.productionService.getMachines(');
    expect(controller).not.toContain('createMachine');
    expect(controller).not.toContain('getActiveMachines');
  });
});
