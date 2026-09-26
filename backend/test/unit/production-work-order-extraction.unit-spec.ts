/**
 * Fase 3C (part 9) — Work Orders and Material Requisitions leave ProductionService.
 *
 * This slice extracts the core work order creation and material requisition lifecycle:
 *   - createWorkOrder (initializes work order and material requisitions from BOM)
 *   - issueMaterial (validates stock, decrements inventory, issues material)
 *   - flagShortage (marks shortage, escalates work order to WAITING_PROCUREMENT)
 *   - getAllRequisitions (lists all material requisitions with work orders and materials)
 *
 * Measured before the move:
 *   - Range 1 (createWorkOrder, issueMaterial, flagShortage): 171 lines
 *   - Range 2 (getAllRequisitions): 14 lines
 *   - Fingerprints: present inside moved ranges, absent outside
 *   - materialRequisition model used only in these 4 methods
 *   - rel() helper was only used in issueMaterial and is now removed from facade
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ProductionService } from '../../src/modules/production/production.service';
import { ProductionWorkOrderService } from '../../src/modules/production/production-work-order.service';

/** The four methods that move to ProductionWorkOrderService. */
const WORK_ORDER_METHODS = [
  'createWorkOrder',
  'issueMaterial',
  'flagShortage',
  'getAllRequisitions',
] as const;

/**
 * Strings that exist only inside the moved bodies — each measured at "inside 1,
 * outside 0" before the move.
 */
const BODY_FINGERPRINTS = [
  'production.work_order.created',
  'INSUFFICIENT_STOCK',
  'Stock不足',
  'ISSUED to WorkOrder',
  'WAREHOUSE_ACTION: MATERIAL_RELEASED',
  'production.material.issued',
  'warehouse.material.issued',
  'production.material.shortage',
  'qty_requested: Number(r.qtyRequested)',
];

const readSource = (file: string) =>
  readFileSync(
    join(__dirname, '..', '..', 'src', 'modules', 'production', file),
    'utf8',
  );

type Callable = (this: unknown, ...args: unknown[]) => unknown;

const methodsOf = (prototype: object) =>
  prototype as unknown as Record<string, Callable>;

/** `new ProductionService(...)` with every collaborator stubbed. */
const buildFacade = (workOrders: unknown) =>
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
    {} as never, // machines
    {} as never, // qrContexts
    workOrders as never,
  );

describe('Fase 3C — work orders & material requisitions live in ProductionWorkOrderService', () => {
  it('ProductionWorkOrderService declares all four methods', () => {
    for (const method of WORK_ORDER_METHODS) {
      expect(typeof methodsOf(ProductionWorkOrderService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it('ProductionService still declares all four (the facade is intact)', () => {
    for (const method of WORK_ORDER_METHODS) {
      expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
        'function',
      );
    }
  });

  it.each(WORK_ORDER_METHODS)(
    'ProductionService.%s forwards to ProductionWorkOrderService exactly once',
    async (method) => {
      const workOrders = Object.fromEntries(
        WORK_ORDER_METHODS.map((m) => [m, jest.fn().mockResolvedValue('delegated')]),
      );
      const service = buildFacade(workOrders);
      const call = methodsOf(service);

      const result = await call[method].call(service, 'arg1', 'arg2');

      expect(result).toBe('delegated');
      expect(workOrders[method]).toHaveBeenCalledWith('arg1', 'arg2');
    },
  );

  describe('the facade keeps no work order or requisition bodies', () => {
    const facade = readSource('production.service.ts');

    it.each(BODY_FINGERPRINTS)('no longer contains %s', (fingerprint) => {
      expect(facade).not.toContain(fingerprint);
    });

    it('has no materialRequisition query left in facade', () => {
      expect(facade).not.toContain('this.prisma.materialRequisition.');
    });

    it('no longer imports or uses rel() helper', () => {
      expect(facade).not.toContain("import { rel } from '../../common/helpers/prisma.helper';");
      expect(facade).not.toMatch(/\brel\(/);
    });

    it('delegates instead', () => {
      for (const method of WORK_ORDER_METHODS) {
        expect(facade).toContain(`this.workOrders.${method}(`);
      }
    });

    it('got smaller — under 550 lines (was 680)', () => {
      expect(facade.split('\n').length).toBeLessThan(550);
    });

    it('keeps the paths this split did not touch', () => {
      for (const method of [
        'verifyStageQC',
        'returnMaterial',
        'finalizeWorkOrderCosting',
        'assignFormulaToPlan',
        'getFormulaAdjustments',
        'createFormulaAdjustment',
      ]) {
        expect(typeof methodsOf(ProductionService.prototype)[method]).toBe(
          'function',
        );
        expect(facade).toContain(`${method}(`);
      }
    });
  });

  describe('the extracted service', () => {
    const workOrderSource = readSource('production-work-order.service.ts');

    it('carries the logic and fingerprints', () => {
      for (const fingerprint of BODY_FINGERPRINTS) {
        expect(workOrderSource).toContain(fingerprint);
      }
    });

    it('depends on prisma, eventEmitter, and idGenerator', () => {
      expect(workOrderSource).toContain('private prisma: PrismaService');
      expect(workOrderSource).toContain('private eventEmitter: EventEmitter2');
      expect(workOrderSource).toContain('private idGenerator: IdGeneratorService');
    });

    it('does not depend on ProductionService', () => {
      expect(workOrderSource).not.toMatch(/from '\.\/production\.service'/);
      expect(workOrderSource).not.toMatch(/extends\s+ProductionService/);
    });

    it('owns the materialRequisition queries and rel helper', () => {
      expect(workOrderSource).toContain('materialRequisition');
      expect(workOrderSource).toContain('rel(');
    });
  });

  it('is registered as a provider in production.module.ts', () => {
    const module = readSource('production.module.ts');
    expect(module).toContain('ProductionWorkOrderService');
  });
});
