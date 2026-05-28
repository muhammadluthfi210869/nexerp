import { Test, TestingModule } from '@nestjs/testing';
import { RndService } from '../../src/modules/rnd/rnd.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IdGeneratorService } from '../../src/modules/system/id-generator.service';
import { TestModule } from '../utilities/test-module';
import { SampleStage } from '@prisma/client';

describe('RndService — Unit', () => {
  let service: RndService;
  let prisma: any;

  beforeEach(async () => {
    prisma = TestModule.mockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RndService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: TestModule.mockEventEmitter() },
        {
          provide: IdGeneratorService,
          useValue: { generateId: jest.fn().mockResolvedValue('SMP-00001') },
        },
      ],
    }).compile();

    service = module.get<RndService>(RndService);
  });

  describe('getDashboardMetrics', () => {
    it('returns dashboard metrics with empty data', async () => {
      prisma.sampleRequest.findMany = jest.fn().mockResolvedValue([]);
      prisma.user.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.getDashboardMetrics();

      expect(result).toHaveProperty('timeliness');
      expect(result).toHaveProperty('accuracy');
      expect(result).toHaveProperty('approval');
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('tables');
      expect(result.approval.submitted).toBe(0);
    });

    it('calculates metrics from sample data', async () => {
      prisma.sampleRequest.findMany = jest.fn().mockResolvedValue([
        {
          id: 'S-1',
          sampleCode: 'SMP-001',
          productName: 'Product A',
          stage: SampleStage.APPROVED,
          completedAt: new Date(),
          requestedAt: new Date(Date.now() - 10 * 86400000),
          targetDeadline: null,
          revisionCount: 0,
          picId: 'P-1',
          pic: { name: 'Staff A' },
          lead: { clientName: 'Client', brandName: 'Brand', pic: { name: 'BD' } },
          stageLogs: [{ leftAt: null, enteredAt: new Date() }],
          formulas: [{ version: 1 }],
        },
      ]);
      prisma.user.findMany = jest.fn().mockResolvedValue([
        { id: 'P-1', fullName: 'Staff A', email: 'a@test.com' },
      ]);

      const result = await service.getDashboardMetrics();

      expect(result.approval.submitted).toBe(1);
      expect(result.approval.approved).toBe(1);
      expect(result.performance.completedProjects).toBe(1);
    });
  });

  describe('getSamples', () => {
    it('returns samples list', async () => {
      const samples = [
        {
          id: 'S-1',
          sampleCode: 'SMP-001',
          productName: 'Product A',
          stage: SampleStage.QUEUE,
        },
      ];
      prisma.sampleRequest.findMany = jest.fn().mockResolvedValue(samples);

      const result = await service.getSamples();
      expect(result).toHaveLength(1);
      expect(result[0].sampleCode).toBe('SMP-001');
    });
  });

  describe('getFormulas', () => {
    it('returns formulas list', async () => {
      const formulas = [
        {
          id: 'F-1',
          formulaCode: 'FRM-001',
          sampleRequest: {
            id: 'S-1',
            sampleCode: 'SMP-001',
            productName: 'Product A',
            lead: { id: 'L-1', clientName: 'Client', brandName: 'Brand' },
          },
          phases: [],
          lockedBy: null,
        },
      ];
      prisma.formula.findMany = jest.fn().mockResolvedValue(formulas);

      const result = await service.getFormulas();
      expect(result).toHaveLength(1);
      expect(result[0].formulaCode).toBe('FRM-001');
    });
  });
});
