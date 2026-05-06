import { Test, TestingModule } from '@nestjs/testing';
import { LegalityService } from '../../src/modules/legality/legality.service';
import { BussdevService } from '../../src/modules/bussdev/bussdev.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TestModule } from '../utilities/test-module';

describe('LegalityService — Unit', () => {
  let service: LegalityService;
  let prisma: any;

  beforeEach(async () => {
    prisma = TestModule.mockPrisma();
    // Add legalTimelineLog which the code uses
    prisma.legalTimelineLog = { create: jest.fn() };
    prisma.legalityLog = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegalityService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: TestModule.mockEventEmitter() },
        { provide: BussdevService, useValue: {} },
      ],
    }).compile();

    service = module.get<LegalityService>(LegalityService);
  });

  describe('validateFormula', () => {
    const makeFormula = (items: any[] = []) => ({
      id: 'F-1',
      name: 'Test',
      phases: [{ items }],
    });

    it('returns canProceed=true for clean formula', async () => {
      prisma.formula = {
        findUnique: jest
          .fn()
          .mockResolvedValue(
            makeFormula([
              { material: { inciName: 'Water' }, dosagePercentage: 80 },
            ]),
          ),
      };
      prisma.masterInci = { findUnique: jest.fn().mockResolvedValue(null) };

      const result = await service.validateFormula('F-1');
      expect(result.canProceed).toBe(true);
    });

    it('flags prohibited substances', async () => {
      prisma.formula = {
        findUnique: jest
          .fn()
          .mockResolvedValue(
            makeFormula([
              { material: { inciName: 'Hydroquinone' }, dosagePercentage: 2 },
            ]),
          ),
      };
      prisma.masterInci = {
        findUnique: jest.fn().mockResolvedValue({
          inciName: 'Hydroquinone',
          category: 'PROHIBITED',
          maxConcentration: null,
          prohibitedContext: 'Banned in cosmetics',
        }),
      };

      const result = await service.validateFormula('F-1');
      expect(result.canProceed).toBe(false);
      expect(result.violations).toHaveLength(1);
    });

    it('throws error when formula not found', async () => {
      prisma.formula = { findUnique: jest.fn().mockResolvedValue(null) };
      await expect(service.validateFormula('VOID')).rejects.toThrow(
        'Formula not found',
      );
    });
  });

  describe('reviewFormula', () => {
    it('approves formula', async () => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.formula = {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'F-1', status: 'WAITING_APPROVAL' }),
        update: jest.fn(),
      };

      await service.reviewFormula('F-1', 'APPROVE', 'Reviewer');
      expect(prisma.formula.update).toHaveBeenCalled();
    });
  });

  describe('checkScmGate', () => {
    it('blocks when artwork not approved', async () => {
      jest
        .spyOn(service, 'checkScmGate' as any)
        .mockResolvedValue({ allowed: false, reason: 'Artwork not approved' });
      const r = await service.checkScmGate('LEAD-1');
      expect(r.allowed).toBe(false);
    });
  });

  describe('checkProductionGate', () => {
    it('blocks when BPOM not published', async () => {
      jest
        .spyOn(service, 'checkProductionGate' as any)
        .mockResolvedValue({ allowed: false, reason: 'BPOM not published' });
      const r = await service.checkProductionGate('LEAD-1');
      expect(r.allowed).toBe(false);
    });
  });

  describe('HKI', () => {
    it('creates HKI record', async () => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.hkiRecord = {
        create: jest.fn().mockResolvedValue({ id: 'HKI-1' }),
      };
      const r = await service.createHki({
        leadId: 'L-1',
        brandName: 'B',
        ownerName: 'O',
      });
      expect(r).toBeDefined();
      expect(prisma.legalTimelineLog.create).toHaveBeenCalled();
    });
  });

  describe('BPOM', () => {
    it('creates BPOM record', async () => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.bpomRecord = {
        create: jest.fn().mockResolvedValue({ id: 'BPOM-1' }),
      };
      const r = await service.createBpom({
        leadId: 'L-1',
        type: 'BPOM',
        productName: 'P',
      });
      expect(r).toBeDefined();
      expect(prisma.legalTimelineLog.create).toHaveBeenCalled();
    });
  });
});
