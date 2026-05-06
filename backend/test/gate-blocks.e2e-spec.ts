import { Test, TestingModule } from '@nestjs/testing';
import { StateTransitionService } from '../src/modules/system/state-transition.service';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

/**
 * Gate Block E2E Tests
 *
 * Verifies that Financial Gates G1, G2, G3 correctly block transitions
 * and that Emergency Override can bypass them.
 */

describe('Gate Block E2E — G1, G2, G3 Enforcement', () => {
  let service: StateTransitionService;
  let prisma: any;

  const mockPrisma = () => ({
    user: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'admin-1',
          managerPin: '000000',
          roles: ['SUPER_ADMIN'],
          status: 'ACTIVE',
        },
      ]),
    },
    stateTransitionLog: { create: jest.fn() },
    systemOverrideLog: { create: jest.fn() },
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

  // ===== GATE 1 BLOCK =====
  describe('Gate 1 — Sample Payment', () => {
    it('G1: blocks WAITING_FINANCE→QUEUE without override', async () => {
      await expect(
        service.executeTransition(
          'SampleStage',
          'sample-1',
          'WAITING_FINANCE',
          'QUEUE',
          {},
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('G1: allows WAITING_FINANCE→QUEUE with valid override PIN', async () => {
      await expect(
        service.executeTransition(
          'SampleStage',
          'sample-1',
          'WAITING_FINANCE',
          'QUEUE',
          {
            overridePin: '000000',
            changedById: 'admin-1',
          },
        ),
      ).resolves.not.toThrow();
    });

    it('G1: non-gate transitions (QUEUE→FORMULATING) bypass gate check', async () => {
      await expect(
        service.executeTransition(
          'SampleStage',
          'sample-1',
          'QUEUE',
          'FORMULATING',
          {
            changedById: 'user-1',
          },
        ),
      ).resolves.not.toThrow();
    });
  });

  // ===== GATE 2 BLOCK =====
  describe('Gate 2 — Production DP (50%)', () => {
    it('G2: blocks PENDING_DP→LOCKED_ACTIVE without override', async () => {
      await expect(
        service.executeTransition(
          'SOStatus',
          'so-1',
          'PENDING_DP',
          'LOCKED_ACTIVE',
          {},
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('G2: allows PENDING_DP→LOCKED_ACTIVE with valid override', async () => {
      await expect(
        service.executeTransition(
          'SOStatus',
          'so-1',
          'PENDING_DP',
          'LOCKED_ACTIVE',
          {
            overridePin: '000000',
            changedById: 'admin-1',
          },
        ),
      ).resolves.not.toThrow();
    });

    it('G2: blocks SPK_SIGNED→DP_PAID without override', async () => {
      await expect(
        service.executeTransition(
          'SalesLead',
          'lead-1',
          'SPK_SIGNED',
          'DP_PAID',
          {},
        ),
      ).rejects.toThrow(BadRequestException); // fails validation first (transition not in map)
    });
  });

  // ===== GATE 3 BLOCK =====
  describe('Gate 3 — Final Payment (Pelunasan)', () => {
    it('G3: blocks READY_TO_SHIP→WON_DEAL without override', async () => {
      await expect(
        service.executeTransition(
          'SalesLead',
          'lead-1',
          'READY_TO_SHIP',
          'WON_DEAL',
          {},
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('G3: allows READY_TO_SHIP→WON_DEAL with valid override PIN', async () => {
      await expect(
        service.executeTransition(
          'SalesLead',
          'lead-1',
          'READY_TO_SHIP',
          'WON_DEAL',
          {
            overridePin: '000000',
            changedById: 'admin-1',
          },
        ),
      ).resolves.not.toThrow();
    });

    it('G3: wrong PIN still blocks', async () => {
      await expect(
        service.executeTransition(
          'SalesLead',
          'lead-1',
          'READY_TO_SHIP',
          'WON_DEAL',
          {
            overridePin: 'wrong-pin',
            changedById: 'admin-1',
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ===== GATE INFO LOOKUP =====
  describe('Gate info lookup', () => {
    it('returns null for non-gate transitions', () => {
      expect(
        service.getGateInfo('SalesLead', 'NEW_LEAD', 'CONTACTED'),
      ).toBeNull();
    });

    it('identifies G1 for WAITING_FINANCE→QUEUE', () => {
      const info = service.getGateInfo(
        'SampleStage',
        'WAITING_FINANCE',
        'QUEUE',
      );
      expect(info?.gate).toBe('G1_SAMPLE');
    });

    it('identifies G2 for PENDING_DP→LOCKED_ACTIVE', () => {
      const info = service.getGateInfo(
        'SOStatus',
        'PENDING_DP',
        'LOCKED_ACTIVE',
      );
      expect(info?.gate).toBe('G2_PRODUCTION');
    });

    it('identifies G3 for READY_TO_SHIP→WON_DEAL', () => {
      const info = service.getGateInfo(
        'SalesLead',
        'READY_TO_SHIP',
        'WON_DEAL',
      );
      expect(info?.gate).toBe('G3_DELIVERY');
    });
  });

  // ===== EDGE CASES =====
  describe('Edge cases', () => {
    it('terminates state cannot transition even with override', async () => {
      await expect(
        service.executeTransition(
          'SalesLead',
          'lead-1',
          'WON_DEAL',
          'CONTACTED',
          {
            overridePin: '000000',
            changedById: 'admin-1',
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('LOST cannot go back to active', async () => {
      await expect(
        service.executeTransition('SalesLead', 'lead-1', 'LOST', 'CONTACTED', {
          overridePin: '000000',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
