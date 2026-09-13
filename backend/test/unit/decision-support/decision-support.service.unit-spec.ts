// Wave 4 / D3 — DecisionSupportService unit tests.

import { DecisionSupportService } from '@/modules/decision-support/decision-support.service';
import { UserRole } from '@prisma/client';

type DecisionAction = 'APPROVE' | 'REJECT' | 'DEFER';

describe('DecisionSupportService', () => {
  let service: DecisionSupportService;
  const prismaMock: any = {
    user: { findUnique: jest.fn() },
    purchaseOrder: { findMany: jest.fn() },
    invoice: { findMany: jest.fn() },
    activityLog: { findMany: jest.fn() },
  };
  const activityLogMock: any = { log: jest.fn() };
  const alertEngineMock: any = {
    evaluateAll: jest.fn().mockResolvedValue([]),
    listRules: jest.fn().mockReturnValue([]),
    setRuleEnabled: jest.fn().mockReturnValue(true),
  };
  const kpiMock: any = {
    computeDivision: jest.fn().mockResolvedValue({
      division: 'FINANCE',
      period: { from: null, to: null },
      aggregateFunction: 'MEAN',
      metricCount: 0,
      aggregateScore: 0,
      metrics: [],
      topPerformers: [],
      formulaNote: '',
    }),
    periodLast7Days: jest.fn().mockReturnValue({}),
  };
  const eventEmitterMock: any = { emit: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DecisionSupportService(
      prismaMock,
      activityLogMock,
      alertEngineMock,
      kpiMock,
      eventEmitterMock,
    );
    // Defaults
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.purchaseOrder.findMany.mockResolvedValue([]);
    prismaMock.invoice.findMany.mockResolvedValue([]);
    prismaMock.activityLog.findMany.mockResolvedValue([]);
    activityLogMock.log.mockResolvedValue(undefined);
  });

  describe('getPendingForUser', () => {
    it('returns [] when user not found', async () => {
      const items = await service.getPendingForUser('no-such-user');
      expect(items).toEqual([]);
    });

    it('returns HIGH-severity pending for stale PENDING_APPROVAL PO', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u-1',
        roles: [UserRole.DIRECTOR],
        fullName: 'Test Director',
      });
      const old = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      prismaMock.purchaseOrder.findMany.mockResolvedValueOnce([
        { id: 'po-1', poNumber: 'PO-001', createdAt: old },
      ]);
      const items = await service.getPendingForUser('u-1');
      expect(items.length).toBe(1);
      expect(items[0].severity).toBe('HIGH');
      expect(items[0].type).toBe('APPROVAL');
      expect(items[0].title).toContain('PO-001');
    });

    it('flags high-value unpaid invoices for director + finance', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u-fin',
        roles: [UserRole.FINANCE],
        fullName: 'Finance User',
      });
      prismaMock.purchaseOrder.findMany.mockResolvedValueOnce([]);
      prismaMock.invoice.findMany.mockResolvedValueOnce([
        {
          id: 'inv-1',
          invoiceNumber: 'INV-HV',
          amountDue: 250000000,
          createdAt: new Date(),
        },
      ]);
      const items = await service.getPendingForUser('u-fin');
      const invItem = items.find((i) => i.contextRefs[0]?.entityType === 'Invoice');
      expect(invItem).toBeDefined();
      expect(invItem?.severity).toBe('CRITICAL');
    });

    it('does NOT expose invoices to non-director/finance roles', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u-rnd',
        roles: [UserRole.RND],
        fullName: 'RND User',
      });
      prismaMock.purchaseOrder.findMany.mockResolvedValueOnce([]);
      const items = await service.getPendingForUser('u-rnd');
      const invItem = items.find((i) => i.contextRefs[0]?.entityType === 'Invoice');
      expect(invItem).toBeUndefined();
    });
  });

  describe('getQueue', () => {
    it('returns paginated org-wide pending items', async () => {
      prismaMock.purchaseOrder.findMany.mockResolvedValueOnce([
        {
          id: 'po-q1',
          poNumber: 'PO-Q',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          totalValue: 500000,
        },
      ]);
      prismaMock.invoice.findMany.mockResolvedValueOnce([
        {
          id: 'inv-q1',
          invoiceNumber: 'INV-Q',
          amountDue: 200000000,
          createdAt: new Date(),
        },
      ]);
      const items = await service.getQueue({ limit: 50 });
      expect(items.length).toBe(2);
      expect(items.find((i) => i.severity === 'CRITICAL')?.title).toContain('INV-Q');
    });

    it('clamps limit to max 200', async () => {
      prismaMock.purchaseOrder.findMany.mockResolvedValueOnce([]);
      prismaMock.invoice.findMany.mockResolvedValueOnce([]);
      await service.getQueue({ limit: 9999 });
      const callArgs = prismaMock.purchaseOrder.findMany.mock.calls[0][0];
      expect(callArgs.take).toBeLessThanOrEqual(200);
    });
  });

  describe('getRecommendations', () => {
    it('returns prioritise-pending when >=3 HIGH/CRITICAL pending', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u-d',
        roles: [UserRole.DIRECTOR],
      });
      const old = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      prismaMock.purchaseOrder.findMany.mockResolvedValueOnce([
        { id: 'po-1', poNumber: 'PO-1', createdAt: old },
        { id: 'po-2', poNumber: 'PO-2', createdAt: old },
      ]);
      prismaMock.invoice.findMany.mockResolvedValueOnce([
        {
          id: 'inv-1',
          invoiceNumber: 'INV-1',
          amountDue: 150000000,
          createdAt: new Date(),
        },
      ]);
      const recs = await service.getRecommendations('u-d');
      const prio = recs.find((r) => r.id === 'rec:prioritise-pending');
      expect(prio).toBeDefined();
    });
  });

  describe('recordDecision', () => {
    it('writes ActivityLog + emits decision.recorded event', async () => {
      const result = await service.recordDecision(
        'd-1',
        'APPROVE' as DecisionAction,
        'Looks good',
        'u-actor',
      );
      expect(activityLogMock.log).toHaveBeenCalledTimes(1);
      const logArgs = activityLogMock.log.mock.calls[0][0];
      expect(logArgs.entityType).toBe('Decision');
      expect(logArgs.entityId).toBe('d-1');
      expect(logArgs.metadata.action).toBe('APPROVE');
      expect(eventEmitterMock.emit).toHaveBeenCalledWith(
        'decision.recorded',
        expect.objectContaining({ decisionId: 'd-1', action: 'APPROVE' }),
      );
      expect(result.action).toBe('APPROVE');
      expect(result.decidedById).toBe('u-actor');
    });
  });

  describe('getHistory', () => {
    it('filters ActivityLog by userId + entityType=Decision', async () => {
      prismaMock.activityLog.findMany.mockResolvedValueOnce([
        { id: 'h-1', entityType: 'Decision', entityId: 'd-1' },
      ]);
      const history = await service.getHistory('u-actor');
      const callArgs = prismaMock.activityLog.findMany.mock.calls[0][0];
      expect(callArgs.where.userId).toBe('u-actor');
      expect(callArgs.where.entityType).toBe('Decision');
      expect(history.length).toBe(1);
    });
  });
});