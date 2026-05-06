import { Test, TestingModule } from '@nestjs/testing';
import { StateTransitionService } from '../src/modules/system/state-transition.service';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('StateMachine — Canonical Transition Validation', () => {
  let service: StateTransitionService;

  const mockPrisma = {
    user: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'admin-1',
          managerPin: '$2b$10$hashedpin',
          roles: ['SUPER_ADMIN'],
          status: 'ACTIVE',
        },
      ]),
    },
    stateTransitionLog: { create: jest.fn() },
    systemOverrideLog: { create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StateTransitionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<StateTransitionService>(StateTransitionService);
  });

  // ===== VALID TRANSITIONS =====
  describe('SalesLead valid transitions', () => {
    const validCases = [
      ['NEW_LEAD', 'CONTACTED'],
      ['CONTACTED', 'NEGOTIATION'],
      ['NEGOTIATION', 'SAMPLE_REQUESTED'],
      ['SAMPLE_REQUESTED', 'WAITING_FINANCE_APPROVAL'],
      ['SPK_SIGNED', 'WAITING_FINANCE_APPROVAL'],
      ['WAITING_FINANCE_APPROVAL', 'SAMPLE_SENT'],
      ['SAMPLE_SENT', 'SAMPLE_APPROVED'],
      ['SAMPLE_APPROVED', 'SPK_SIGNED'],
      ['DP_PAID', 'PRODUCTION_PLAN'],
      ['PRODUCTION_PLAN', 'READY_TO_SHIP'],
      ['READY_TO_SHIP', 'WON_DEAL'],
      ['NEW_LEAD', 'LOST'],
      ['CONTACTED', 'LOST'],
      ['NEGOTIATION', 'LOST'],
      ['SAMPLE_APPROVED', 'LOST'],
    ];

    test.each(validCases)('%s → %s should pass', (from, to) => {
      expect(() =>
        service.validateTransition('SalesLead', from, to),
      ).not.toThrow();
    });
  });

  describe('SampleStage valid transitions', () => {
    const validCases = [
      ['WAITING_FINANCE', 'QUEUE'],
      ['QUEUE', 'FORMULATING'],
      ['FORMULATING', 'LAB_TEST'],
      ['LAB_TEST', 'READY_TO_SHIP'],
      ['READY_TO_SHIP', 'SHIPPED'],
      ['SHIPPED', 'RECEIVED'],
      ['RECEIVED', 'CLIENT_REVIEW'],
      ['CLIENT_REVIEW', 'APPROVED'],
      ['CLIENT_REVIEW', 'REJECTED'],
      ['WAITING_FINANCE', 'CANCELLED'],
    ];

    test.each(validCases)('%s → %s should pass', (from, to) => {
      expect(() =>
        service.validateTransition('SampleStage', from, to),
      ).not.toThrow();
    });
  });

  describe('SOStatus valid transitions', () => {
    const validCases = [
      ['PENDING_DP', 'LOCKED_ACTIVE'],
      ['LOCKED_ACTIVE', 'READY_TO_PRODUCE'],
      ['READY_TO_PRODUCE', 'COMPLETED'],
      ['PENDING_DP', 'CANCELLED'],
    ];

    test.each(validCases)('%s → %s should pass', (from, to) => {
      expect(() =>
        service.validateTransition('SOStatus', from, to),
      ).not.toThrow();
    });
  });

  describe('DesignState valid transitions', () => {
    const validCases = [
      ['INBOX', 'IN_PROGRESS'],
      ['IN_PROGRESS', 'WAITING_APJ'],
      ['WAITING_APJ', 'WAITING_CLIENT'],
      ['WAITING_CLIENT', 'REVISION'],
      ['REVISION', 'LOCKED'],
    ];

    test.each(validCases)('%s → %s should pass', (from, to) => {
      expect(() =>
        service.validateTransition('DesignState', from, to),
      ).not.toThrow();
    });
  });

  describe('RegStage valid transitions', () => {
    const validCases = [
      ['DRAFT', 'SUBMITTED'],
      ['SUBMITTED', 'EVALUATION'],
      ['EVALUATION', 'PUBLISHED'],
      ['EVALUATION', 'REVISION'],
      ['REVISION', 'SUBMITTED'],
    ];

    test.each(validCases)('%s → %s should pass', (from, to) => {
      expect(() =>
        service.validateTransition('RegStage', from, to),
      ).not.toThrow();
    });
  });

  // ===== INVALID TRANSITIONS =====
  describe('Invalid transitions should throw', () => {
    const invalidCases: [string, string, string][] = [
      ['SalesLead', 'NEW_LEAD', 'WON_DEAL'],
      ['SalesLead', 'CONTACTED', 'WON_DEAL'],
      ['SalesLead', 'WON_DEAL', 'NEW_LEAD'],
      ['SalesLead', 'LOST', 'CONTACTED'],
      ['SampleStage', 'QUEUE', 'APPROVED'],
      ['SampleStage', 'FORMULATING', 'APPROVED'],
      ['SampleStage', 'APPROVED', 'QUEUE'],
      ['SampleStage', 'APPROVED', 'REJECTED'],
      ['SOStatus', 'PENDING_DP', 'COMPLETED'],
      ['SOStatus', 'COMPLETED', 'PENDING_DP'],
      ['DesignState', 'LOCKED', 'INBOX'],
      ['RegStage', 'DRAFT', 'PUBLISHED'],
      ['RegStage', 'PUBLISHED', 'SUBMITTED'],
    ];

    test.each(invalidCases)('%s: %s → %s should throw', (entity, from, to) => {
      expect(() => service.validateTransition(entity as any, from, to)).toThrow(
        BadRequestException,
      );
    });
  });

  // ===== GATE-CONTROLLED TRANSITIONS =====
  describe('Gate-controlled transitions', () => {
    it('should identify G1_SAMPLE gate', () => {
      const gate = service.getGateInfo('SalesLead', 'WAITING_FINANCE', 'QUEUE');
      expect(gate).not.toBeNull();
      expect(gate!.gate).toBe('G1_SAMPLE');
    });

    it('should identify G2_PRODUCTION gate', () => {
      const gate = service.getGateInfo('SalesLead', 'SPK_SIGNED', 'DP_PAID');
      // The GATE_CONTROLLED_TRANSITIONS uses 'SPK_SIGNED→DP_PAID'
      expect(gate).not.toBeNull();
      expect(gate!.gate).toBe('G2_PRODUCTION');
    });

    it('should identify G3_DELIVERY gate', () => {
      const gate = service.getGateInfo(
        'SalesLead',
        'READY_TO_SHIP',
        'WON_DEAL',
      );
      expect(gate).not.toBeNull();
      expect(gate!.gate).toBe('G3_DELIVERY');
    });

    it('should return null for non-gate transitions', () => {
      const gate = service.getGateInfo('SalesLead', 'NEW_LEAD', 'CONTACTED');
      expect(gate).toBeNull();
    });
  });

  // ===== ALLOWED TRANSITIONS LIST =====
  describe('getAllowedTransitions', () => {
    it('should return correct next states for NEW_LEAD', () => {
      const allowed = service.getAllowedTransitions('SalesLead', 'NEW_LEAD');
      expect(allowed).toContain('CONTACTED');
      expect(allowed).toContain('LOST');
      expect(allowed).not.toContain('WON_DEAL');
    });

    it('should return empty array for final states', () => {
      expect(service.getAllowedTransitions('SalesLead', 'WON_DEAL')).toEqual(
        [],
      );
      expect(service.getAllowedTransitions('SampleStage', 'APPROVED')).toEqual(
        [],
      );
      expect(service.getAllowedTransitions('SOStatus', 'COMPLETED')).toEqual(
        [],
      );
    });
  });

  // ===== UNKNOWN ENTITY/STATUS =====
  describe('Edge cases', () => {
    it('should throw for unknown entity type', () => {
      expect(() =>
        service.validateTransition('UnknownEntity' as any, 'A', 'B'),
      ).toThrow(BadRequestException);
    });

    it('should throw for unknown from-state', () => {
      expect(() =>
        service.validateTransition('SalesLead', 'UNKNOWN_STATE', 'WON_DEAL'),
      ).toThrow(BadRequestException);
    });
  });
});
