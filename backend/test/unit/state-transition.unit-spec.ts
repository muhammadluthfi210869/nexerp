import { Test, TestingModule } from '@nestjs/testing';
import {
  StateTransitionService,
  EntityType,
} from '../../src/modules/system/state-transition.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('StateTransitionService — Unit', () => {
  let service: StateTransitionService;
  let prisma: any;

  const mockPrisma = () => ({
    user: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'admin-1',
          managerPin: '123456',
          roles: ['SUPER_ADMIN'],
          status: 'ACTIVE',
        },
      ]),
    },
    stateTransitionLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
    },
    systemOverrideLog: {
      create: jest.fn().mockResolvedValue({ id: 'override-1' }),
    },
  });

  beforeEach(async () => {
    prisma = mockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StateTransitionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<StateTransitionService>(StateTransitionService);
  });

  describe('validateTransition', () => {
    it.each([
      ['SalesLead', 'NEW_LEAD', 'CONTACTED'],
      ['SalesLead', 'NEGOTIATION', 'SAMPLE_REQUESTED'],
      ['SampleStage', 'QUEUE', 'FORMULATING'],
      ['SOStatus', 'PENDING_DP', 'LOCKED_ACTIVE'],
      ['DesignState', 'INBOX', 'IN_PROGRESS'],
      ['RegStage', 'DRAFT', 'SUBMITTED'],
      ['FormulaStatus', 'DRAFT', 'WAITING_APPROVAL'],
      ['LifecycleStatus', 'WAITING_MATERIAL', 'WAITING_PROCUREMENT'],
    ])('%s %s → %s passes', (entity, from, to) => {
      expect(() =>
        service.validateTransition(entity as EntityType, from, to),
      ).not.toThrow();
    });

    it.each([
      ['SalesLead', 'NEW_LEAD', 'WON_DEAL'],
      ['SalesLead', 'LOST', 'CONTACTED'],
      ['SampleStage', 'QUEUE', 'APPROVED'],
      ['SOStatus', 'PENDING_DP', 'COMPLETED'],
      ['DesignState', 'LOCKED', 'INBOX'],
      ['RegStage', 'PUBLISHED', 'SUBMITTED'],
    ])('%s %s → %s throws', (entity, from, to) => {
      expect(() =>
        service.validateTransition(entity as EntityType, from, to),
      ).toThrow(BadRequestException);
    });

    it('throws for unknown entity', () => {
      expect(() =>
        service.validateTransition('Unknown' as any, 'A', 'B'),
      ).toThrow(BadRequestException);
    });

    it('throws for unknown from-state', () => {
      expect(() =>
        service.validateTransition('SalesLead', 'VOID', 'CONTACTED'),
      ).toThrow(BadRequestException);
    });
  });

  describe('getGateInfo', () => {
    it('identifies G1_SAMPLE', () => {
      const gate = service.getGateInfo(
        'SampleStage',
        'WAITING_FINANCE',
        'QUEUE',
      );
      expect(gate).not.toBeNull();
      expect(gate!.gate).toBe('G1_SAMPLE');
    });

    it('identifies G2_PRODUCTION for SPK_SIGNED→DP_PAID', () => {
      const gate = service.getGateInfo('SalesLead', 'SPK_SIGNED', 'DP_PAID');
      expect(gate).not.toBeNull();
      expect(gate!.gate).toBe('G2_PRODUCTION');
    });

    it('identifies G3_DELIVERY for READY_TO_SHIP→WON_DEAL', () => {
      const gate = service.getGateInfo(
        'SalesLead',
        'READY_TO_SHIP',
        'WON_DEAL',
      );
      expect(gate).not.toBeNull();
      expect(gate!.gate).toBe('G3_DELIVERY');
    });

    it('returns null for non-gate transitions', () => {
      expect(
        service.getGateInfo('SalesLead', 'NEW_LEAD', 'CONTACTED'),
      ).toBeNull();
    });
  });

  describe('executeTransition', () => {
    it('executes valid non-gate transition', async () => {
      await expect(
        service.executeTransition(
          'SalesLead',
          'lead-1',
          'NEW_LEAD',
          'CONTACTED',
          {
            changedById: 'user-1',
            reason: 'Initial contact',
          },
        ),
      ).resolves.not.toThrow();

      expect(prisma.stateTransitionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'SalesLead',
            entityId: 'lead-1',
            fromState: 'NEW_LEAD',
            toState: 'CONTACTED',
          }),
        }),
      );
    });

    it('blocks gate transition without override PIN', async () => {
      // READY_TO_SHIP→WON_DEAL is both valid AND gate-controlled (G3)
      await expect(
        service.executeTransition(
          'SalesLead',
          'lead-1',
          'READY_TO_SHIP',
          'WON_DEAL',
          {
            changedById: 'user-1',
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('executes gate transition with valid override PIN (plaintext)', async () => {
      // PIN '123456' matches plaintext fallback in verifyOverridePin
      await expect(
        service.executeTransition(
          'SalesLead',
          'lead-1',
          'READY_TO_SHIP',
          'WON_DEAL',
          {
            changedById: 'admin-1',
            overridePin: '123456',
            reason: 'Emergency override',
          },
        ),
      ).resolves.not.toThrow();

      expect(prisma.systemOverrideLog.create).toHaveBeenCalled();
      expect(prisma.stateTransitionLog.create).toHaveBeenCalled();
    });

    it('rejects invalid override PIN', async () => {
      await expect(
        service.executeTransition(
          'SalesLead',
          'lead-1',
          'READY_TO_SHIP',
          'WON_DEAL',
          {
            changedById: 'user-1',
            overridePin: 'wrong-pin',
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws for invalid transition even with override pin', async () => {
      await expect(
        service.executeTransition(
          'SalesLead',
          'lead-1',
          'NEW_LEAD',
          'WON_DEAL',
          {
            changedById: 'admin-1',
            overridePin: '123456',
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllowedTransitions', () => {
    it('returns correct transitions for NEW_LEAD', () => {
      expect(service.getAllowedTransitions('SalesLead', 'NEW_LEAD')).toEqual([
        'CONTACTED',
        'LOST',
      ]);
    });

    it('returns empty for terminal states', () => {
      expect(service.getAllowedTransitions('SalesLead', 'WON_DEAL')).toEqual(
        [],
      );
      expect(service.getAllowedTransitions('SalesLead', 'LOST')).toEqual([]);
    });

    it('returns empty for unknown entity', () => {
      expect(service.getAllowedTransitions('Unknown' as any, 'A')).toEqual([]);
    });
  });

  describe('handleStateTransition event', () => {
    it('logs event via listener', async () => {
      await service.handleStateTransition({
        entityType: 'SalesLead',
        entityId: 'lead-1',
        fromState: 'NEW_LEAD',
        toState: 'CONTACTED',
        changedById: 'user-1',
      });
      expect(prisma.stateTransitionLog.create).toHaveBeenCalled();
    });
  });

  describe('getAllLogs', () => {
    it('fetches logs with user info', async () => {
      prisma.stateTransitionLog.findMany = jest
        .fn()
        .mockResolvedValue([{ id: 'log-1', changedBy: { fullName: 'Admin' } }]);
      const logs = await service.getAllLogs(10);
      expect(logs).toHaveLength(1);
    });
  });
});
