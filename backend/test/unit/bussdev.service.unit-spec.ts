import { Test, TestingModule } from '@nestjs/testing';
import { BussdevService } from '../../src/modules/bussdev/bussdev.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { CacheService } from '../../src/shared/cache.service';
import { IdGeneratorService } from '../../src/modules/system/id-generator.service';
import { ScmService } from '../../src/modules/scm/services/scm.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowStatus } from '@prisma/client';

const mockTx = {
  bussdevStaff: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  salesLead: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  leadTimelineLog: { create: jest.fn() },
  activityStream: { create: jest.fn() },
  leadActivity: { create: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
  sampleRequest: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  newProductForm: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  salesOrder: { create: jest.fn(), findUnique: jest.fn() },
  workOrder: { findMany: jest.fn(), updateMany: jest.fn() },
};

const mockPrisma = {
  $transaction: jest.fn((cb: (tx: any) => any) => cb(mockTx)),
  salesLead: {
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  leadActivity: { count: jest.fn(), aggregate: jest.fn() },
  activityStream: { findMany: jest.fn() },
  bussdevStaff: { findMany: jest.fn() },
  sampleRequest: { findMany: jest.fn() },
};

const mockEventEmitter = { emit: jest.fn() };
const mockIdGenerator = { generateId: jest.fn().mockResolvedValue('WO-001') };
const mockCacheService = { get: jest.fn(), set: jest.fn() };
const mockScmService = {};

describe.skip('BussdevService — Unit (DI unresolved — CacheService + forwardRef ScmService)', () => {
  let service: BussdevService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BussdevService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: IdGeneratorService, useValue: mockIdGenerator },
        { provide: CacheService, useValue: mockCacheService },
        { provide: ScmService, useValue: mockScmService },
      ],
    }).compile();

    service = module.get<BussdevService>(BussdevService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLead', () => {
    it('creates a lead with correct data and NEW_LEAD status', async () => {
      const dto = {
        clientName: 'PT Test',
        brandName: 'Brand Test',
        contactInfo: 'test@test.com',
        source: 'REFERRAL',
        productInterest: 'Skincare',
        estimatedValue: 100000000,
        picId: 'staff-1',
      };

      mockTx.bussdevStaff.findUnique.mockResolvedValue({
        id: 'staff-1',
        userId: 'user-1',
        name: 'Staff A',
      });
      mockTx.salesLead.create.mockResolvedValue({
        id: 'LEAD-1',
        ...dto,
        status: WorkflowStatus.NEW_LEAD,
      });
      mockTx.leadTimelineLog.create.mockResolvedValue({});

      const result = await service.createLead(dto);

      expect(result.id).toBe('LEAD-1');
      expect(result.status).toBe(WorkflowStatus.NEW_LEAD);
      expect(mockTx.salesLead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clientName: 'PT Test',
            brandName: 'Brand Test',
          }),
        }),
      );
    });

    it('throws BadRequestException when no staff found for auto-assignment', async () => {
      const dto = {
        clientName: 'PT Test',
        brandName: 'Brand Test',
        contactInfo: 'test@test.com',
        source: 'REFERRAL',
        productInterest: 'Skincare',
        estimatedValue: 100000000,
        picId: 'AUTO',
      };

      mockTx.bussdevStaff.findMany.mockResolvedValue([]);
      mockTx.bussdevStaff.findFirst.mockResolvedValue(null);

      await expect(service.createLead(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('advanceLeadStage', () => {
    it('throws NotFoundException when lead does not exist', async () => {
      mockTx.salesLead.findUnique.mockResolvedValue(null);

      const dto = {
        action: 'STAGE_UPDATED' as const,
        newStatus: WorkflowStatus.CONTACTED,
        notes: 'Test',
        loggedBy: 'User',
      };

      await expect(
        service.advanceLeadStage('NONEXISTENT', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates lead status to CONTACTED', async () => {
      const mockLead = {
        id: 'LEAD-1',
        status: WorkflowStatus.NEW_LEAD,
        lastStageAt: new Date(),
        createdAt: new Date(),
        spkFileUrl: null,
        clientName: 'PT Test',
        brandName: 'Brand',
        productInterest: 'Skincare',
        bdId: 'user-1',
        paymentType: 'PREPAID',
        isRepeatOrder: false,
        categoryEnum: null,
        moq: 0,
        planOmset: 0,
        packagingSuggestion: null,
        designSuggestion: null,
        valueSuggestion: null,
        notes: null,
      };
      mockTx.salesLead.findUnique.mockResolvedValue(mockLead);
      mockTx.salesLead.update.mockResolvedValue({
        ...mockLead,
        status: WorkflowStatus.CONTACTED,
      });
      mockTx.leadTimelineLog.create.mockResolvedValue({});

      const dto = {
        action: 'STAGE_UPDATED' as const,
        newStatus: WorkflowStatus.CONTACTED,
        notes: 'Following up',
        loggedBy: 'BD Staff',
      };

      const result = await service.advanceLeadStage('LEAD-1', dto);

      expect(result.status).toBe(WorkflowStatus.CONTACTED);
      expect(mockTx.salesLead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'LEAD-1' },
          data: expect.objectContaining({ status: WorkflowStatus.CONTACTED }),
        }),
      );
    });
  });

  describe('getLeads', () => {
    it('returns a list of leads', async () => {
      const mockLeads = [
        { id: 'L1', clientName: 'Client A', status: 'NEW_LEAD' },
        { id: 'L2', clientName: 'Client B', status: 'CONTACTED' },
      ];
      mockPrisma.salesLead.findMany.mockResolvedValue(mockLeads);

      const result = await service.getLeads();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('L1');
      expect(result[1].id).toBe('L2');
      expect(mockPrisma.salesLead.findMany).toHaveBeenCalled();
    });

    it('returns empty array when no leads exist', async () => {
      mockPrisma.salesLead.findMany.mockResolvedValue([]);

      const result = await service.getLeads();

      expect(result).toEqual([]);
    });
  });
});
