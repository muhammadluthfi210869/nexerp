// Wave 2/A3 — StateTransitionService unit tests.
// Pure synchronous validation + transactional executeTransition (Prisma + EventEmitter2).
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { StateTransitionService } from '../state-transition.service';

describe('StateTransitionService', () => {
  let service: StateTransitionService;
  let prismaMock: any;
  let eventEmitterMock: any;

  beforeEach(() => {
    prismaMock = {
      stateTransitionLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      systemOverrideLog: { create: jest.fn().mockResolvedValue({ id: 'ovr-1' }) },
      user: { findMany: jest.fn().mockResolvedValue([]) },
    };
    eventEmitterMock = { emit: jest.fn() };
    service = new StateTransitionService(prismaMock, eventEmitterMock);
  });

  describe('validateTransition', () => {
    it('accepts allowed transition NEW_LEAD -> CONTACTED', () => {
      expect(() => service.validateTransition('SalesLead', 'NEW_LEAD', 'CONTACTED')).not.toThrow();
    });

    it('rejects unknown entity type', () => {
      expect(() =>
        service.validateTransition('UnknownEntity' as any, 'NEW_LEAD', 'CONTACTED'),
      ).toThrow(BadRequestException);
    });

    it('rejects unknown fromState', () => {
      expect(() => service.validateTransition('SalesLead', 'NOT_A_STATE', 'CONTACTED')).toThrow(
        BadRequestException,
      );
    });

    it('rejects disallowed transition NEW_LEAD -> WON_DEAL', () => {
      expect(() => service.validateTransition('SalesLead', 'NEW_LEAD', 'WON_DEAL')).toThrow(
        BadRequestException,
      );
    });

    it('rejects transitions out of terminal states (LOST has no exits)', () => {
      expect(() => service.validateTransition('SalesLead', 'LOST', 'CONTACTED')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('getGateInfo', () => {
    it('returns gate info for SPK_SIGNED -> DP_PAID (G2_PRODUCTION)', () => {
      const info = service.getGateInfo('SalesLead', 'SPK_SIGNED', 'DP_PAID');
      expect(info).toEqual(expect.objectContaining({ gate: 'G2_PRODUCTION' }));
    });

    it('returns null for non-gate-controlled transition', () => {
      expect(service.getGateInfo('SalesLead', 'NEW_LEAD', 'CONTACTED')).toBeNull();
    });
  });

  describe('getAllowedTransitions', () => {
    it('returns the next-state list for a known current state', () => {
      const list = service.getAllowedTransitions('SalesLead', 'NEW_LEAD');
      expect(list).toEqual(expect.arrayContaining(['CONTACTED', 'LOST']));
    });

    it('returns [] for unknown entity', () => {
      expect(service.getAllowedTransitions('UnknownEntity' as any, 'NEW_LEAD')).toEqual([]);
    });

    it('returns [] for unknown current state', () => {
      expect(service.getAllowedTransitions('SalesLead', 'NOT_A_STATE')).toEqual([]);
    });
  });

  describe('executeTransition (non-gate)', () => {
    it('logs the transition + returns void', async () => {
      await service.executeTransition('SalesLead', 'lead-1', 'NEW_LEAD', 'CONTACTED', {
        changedById: 'user-1',
        reason: 'initial contact',
      });
      expect(prismaMock.stateTransitionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'SalesLead',
            entityId: 'lead-1',
            fromState: 'NEW_LEAD',
            toState: 'CONTACTED',
          }),
        }),
      );
      expect(eventEmitterMock.emit).not.toHaveBeenCalled();
    });
  });

  describe('executeTransition (gate-controlled)', () => {
    it('throws ForbiddenException when overridePin missing', async () => {
      await expect(
        service.executeTransition('SalesLead', 'lead-1', 'SPK_SIGNED', 'DP_PAID', {
          changedById: 'user-1',
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(eventEmitterMock.emit).not.toHaveBeenCalled();
    });

    it('emits gate event when override PIN accepted (plain-text fallback)', async () => {
      prismaMock.user.findMany.mockResolvedValueOnce([
        { id: 'admin-1', managerPin: '123456' },
      ]);
      await service.executeTransition('SalesLead', 'lead-1', 'SPK_SIGNED', 'DP_PAID', {
        changedById: 'user-1',
        overridePin: '123456',
      });
      expect(prismaMock.systemOverrideLog.create).toHaveBeenCalled();
      expect(eventEmitterMock.emit).toHaveBeenCalledWith(
        'finance.gate2.verified',
        expect.objectContaining({ verifiedBy: 'user-1' }),
      );
    });

    it('throws ForbiddenException when PIN does not match any admin', async () => {
      prismaMock.user.findMany.mockResolvedValueOnce([
        { id: 'admin-1', managerPin: 'correct-pin' },
      ]);
      await expect(
        service.executeTransition('SalesLead', 'lead-1', 'SPK_SIGNED', 'DP_PAID', {
          overridePin: 'wrong-pin',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAllLogs', () => {
    it('returns the last 100 logs by default', async () => {
      await service.getAllLogs();
      expect(prismaMock.stateTransitionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('respects custom limit', async () => {
      await service.getAllLogs(25);
      expect(prismaMock.stateTransitionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 25 }),
      );
    });
  });
});
