import { Test, TestingModule } from '@nestjs/testing';
import { LegalityService } from '../../src/modules/legality/legality.service';
import { BussdevService } from '../../src/modules/bussdev/bussdev.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TestModule } from '../utilities/test-module';
import { LegalStatus } from '@prisma/client';

describe('LegalityService — Dashboard/HKI Unit', () => {
  let service: LegalityService;
  let prisma: any;

  beforeEach(async () => {
    prisma = TestModule.mockPrisma();
    prisma.legalTimelineLog = { create: jest.fn() };
    prisma.halalRecord = { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn() };
    prisma.legalStaff = { findMany: jest.fn() };
    prisma.regulatoryPipeline = { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn() };

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

  describe('getDashboardMetrics', () => {
    it('returns dashboard metrics with empty data', async () => {
      prisma.hkiRecord.findMany = jest.fn().mockResolvedValue([]);
      prisma.bpomRecord.findMany = jest.fn().mockResolvedValue([]);
      prisma.halalRecord.findMany = jest.fn().mockResolvedValue([]);
      prisma.legalStaff.findMany = jest.fn().mockResolvedValue([]);
      prisma.regulatoryPipeline.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.getDashboardMetrics();

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('pipeline');
      expect(result).toHaveProperty('bpomStats');
      expect(result).toHaveProperty('hkiStats');
      expect(result).toHaveProperty('halalStats');
      expect(result).toHaveProperty('riskMonitor');
      expect(result.overall.activeTotal).toBe(0);
    });

    it('counts critical expiry items', async () => {
      const today = new Date();
      const soonDate = new Date(today.getTime() + 30 * 86400000);
      prisma.hkiRecord.findMany = jest.fn().mockResolvedValue([
        { id: 'H-1', hkiId: 'HKI-001', brandName: 'Brand', expiryDate: soonDate, status: LegalStatus.IN_PROGRESS, applicationDate: new Date(), stage: 'DRAFT', pic: null },
      ]);
      prisma.bpomRecord.findMany = jest.fn().mockResolvedValue([]);
      prisma.halalRecord.findMany = jest.fn().mockResolvedValue([]);
      prisma.legalStaff.findMany = jest.fn().mockResolvedValue([]);
      prisma.regulatoryPipeline.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.getDashboardMetrics();
      expect(result.riskMonitor.under90Days).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getHkiRecords', () => {
    it('returns HKI records with time metrics', async () => {
      prisma.hkiRecord.findMany = jest.fn().mockResolvedValue([
        {
          id: 'H-1',
          hkiId: 'HKI-001',
          brandName: 'Brand A',
          applicationDate: new Date(Date.now() - 30 * 86400000),
          expiryDate: new Date(Date.now() + 300 * 86400000),
          status: LegalStatus.IN_PROGRESS,
          stage: 'DRAFT',
          pic: null,
        },
      ]);

      const result = await service.getHkiRecords();
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('daysElapsed');
      expect(result[0]).toHaveProperty('daysLeft');
    });
  });

  describe('createHki', () => {
    it('creates HKI record with timeline log', async () => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.hkiRecord.create = jest.fn().mockResolvedValue({ id: 'H-1' });

      const result = await service.createHki({
        leadId: 'L-1',
        brandName: 'Test Brand',
        ownerName: 'Owner',
        picId: 'PIC-1',
      });

      expect(result).toBeDefined();
      expect(prisma.hkiRecord.create).toHaveBeenCalled();
      expect(prisma.legalTimelineLog.create).toHaveBeenCalled();
    });
  });
});
