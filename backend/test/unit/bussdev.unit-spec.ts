import { Test, TestingModule } from '@nestjs/testing';
import { BussdevService } from '../../src/modules/bussdev/bussdev.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IdGeneratorService } from '../../src/modules/system/id-generator.service';
import { ScmService } from '../../src/modules/scm/services/scm.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkflowStatus, SampleStage } from '@prisma/client';
import { TestModule } from '../utilities/test-module';

describe('BussdevService — Unit', () => {
  let service: BussdevService;
  let prisma: any;
  let eventEmitter: any;

  const staffId = 'STAFF-001';
  const leadId = 'LEAD-001';

  const makeAdvanceDto = (overrides: Record<string, any> = {}) => ({
    action: 'STAGE_UPDATED' as const,
    newStatus: WorkflowStatus.CONTACTED,
    notes: 'Test',
    loggedBy: 'USER-001',
    ...overrides,
  });

  beforeEach(async () => {
    prisma = TestModule.mockPrisma();
    eventEmitter = TestModule.mockEventEmitter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BussdevService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
        {
          provide: IdGeneratorService,
          useValue: { generateId: jest.fn().mockResolvedValue('SMP-00001') },
        },
        { provide: ScmService, useValue: { createPR: jest.fn() } },
      ],
    }).compile();

    service = module.get<BussdevService>(BussdevService);
  });

  describe('createLead', () => {
    const baseDto: any = {
      clientName: 'Test Client',
      brandName: 'Test Brand',
      contactInfo: 'test@test.com',
      source: 'REFERRAL',
      productInterest: 'Skincare',
      estimatedValue: 100000000,
      picId: staffId,
      category: 'COSMETICS',
      notes: 'Test lead',
      moq: 1000,
      planOmset: 200000000,
      hkiMode: 'NEW',
      paymentType: 'PREPAID',
      isRepeatOrder: false,
      province: 'Jakarta',
      city: 'Jakarta Selatan',
    };

    it('creates lead with status NEW_LEAD', async () => {
      prisma.bussdevStaff.findUnique.mockResolvedValue({
        id: staffId,
        userId: 'USER-001',
        name: 'Test Staff',
      });
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.salesLead.create.mockResolvedValue({
        id: leadId,
        status: WorkflowStatus.NEW_LEAD,
      });
      prisma.leadTimelineLog = { create: jest.fn() };
      prisma.activityStream = { create: jest.fn() };

      const result = await service.createLead(baseDto);
      expect(result.status).toBe(WorkflowStatus.NEW_LEAD);
    });

    it('auto-assigns PIC with least workload', async () => {
      prisma.bussdevStaff.findMany = jest.fn().mockResolvedValue([
        { id: 'STAFF-A', _count: { salesLeads: 5 } },
        { id: 'STAFF-B', _count: { salesLeads: 2 } },
      ]);
      prisma.bussdevStaff.findUnique = jest
        .fn()
        .mockResolvedValue({ id: 'STAFF-B', userId: 'U-B', name: 'Low Load' });
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.salesLead.create = jest
        .fn()
        .mockResolvedValue({ id: leadId, picId: 'STAFF-B' });
      prisma.leadTimelineLog = { create: jest.fn() };
      prisma.activityStream = { create: jest.fn() };

      const result = await service.createLead({ ...baseDto, picId: 'AUTO' });
      expect(prisma.salesLead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ picId: 'STAFF-B' }),
        }),
      );
    });

    it('throws when no staff exists for AUTO', async () => {
      prisma.bussdevStaff.findMany = jest.fn().mockResolvedValue([]);
      prisma.bussdevStaff.findFirst = jest.fn().mockResolvedValue(null);
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));

      await expect(
        service.createLead({ ...baseDto, picId: 'AUTO' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates sample requests when provided in intake', async () => {
      prisma.bussdevStaff.findUnique.mockResolvedValue({
        id: staffId,
        userId: 'USER-001',
        name: 'Staff',
      });
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.salesLead.create = jest.fn().mockResolvedValue({ id: leadId });
      prisma.sampleRequest = { create: jest.fn() };
      prisma.activityStream = { create: jest.fn() };
      prisma.leadTimelineLog = { create: jest.fn() };

      await service.createLead({
        ...baseDto,
        sampleRequests: [
          { productName: 'Test', notes: 'Note', targetPrice: 50000 },
        ],
      });
      expect(prisma.sampleRequest.create).toHaveBeenCalled();
    });
  });

  describe('advanceLeadStage', () => {
    const lead = {
      id: leadId,
      status: WorkflowStatus.NEW_LEAD,
      picId: staffId,
      bdId: 'U-1',
      createdAt: new Date(),
      lastStageAt: new Date(),
      isEmergencyOverride: false,
    };

    beforeEach(() => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.salesLead.findUnique = jest.fn().mockResolvedValue(lead);
      prisma.salesLead.update = jest
        .fn()
        .mockResolvedValue({ ...lead, status: WorkflowStatus.CONTACTED });
    });

    it('advances from NEW_LEAD to CONTACTED', async () => {
      prisma.leadTimelineLog = { create: jest.fn() };
      prisma.activityStream = { create: jest.fn() };

      await service.advanceLeadStage(leadId, makeAdvanceDto());
      expect(prisma.salesLead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: WorkflowStatus.CONTACTED }),
        }),
      );
    });

    it('blocks DP_PAID and PRODUCTION_PLAN without override', async () => {
      prisma.salesLead.findUnique = jest
        .fn()
        .mockResolvedValue({ ...lead, isEmergencyOverride: false });

      await expect(
        service.advanceLeadStage(
          leadId,
          makeAdvanceDto({ newStatus: WorkflowStatus.DP_PAID }),
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.advanceLeadStage(
          leadId,
          makeAdvanceDto({ newStatus: WorkflowStatus.PRODUCTION_PLAN }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates payment activity for WAITING_FINANCE_APPROVAL', async () => {
      prisma.salesLead.findUnique = jest.fn().mockResolvedValue({
        ...lead,
        status: WorkflowStatus.SAMPLE_REQUESTED,
      });
      prisma.leadActivity = { create: jest.fn() };
      prisma.leadTimelineLog = { create: jest.fn() };
      prisma.activityStream = { create: jest.fn() };

      await service.advanceLeadStage(
        leadId,
        makeAdvanceDto({
          newStatus: WorkflowStatus.WAITING_FINANCE_APPROVAL,
          paymentProofUrl: '/uploads/proof.jpg',
        }),
      );

      expect(prisma.leadActivity.create).toHaveBeenCalled();
    });

    it('throws when WAITING_FINANCE_APPROVAL no payment proof', async () => {
      prisma.salesLead.findUnique = jest.fn().mockResolvedValue({
        ...lead,
        status: WorkflowStatus.SAMPLE_REQUESTED,
      });

      await expect(
        service.advanceLeadStage(
          leadId,
          makeAdvanceDto({
            newStatus: WorkflowStatus.WAITING_FINANCE_APPROVAL,
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates NPF when advancing to SAMPLE_REQUESTED', async () => {
      prisma.salesLead.findUnique = jest
        .fn()
        .mockResolvedValue({ ...lead, status: WorkflowStatus.NEGOTIATION });
      prisma.newProductForm = {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'NPF-1' }),
      };
      prisma.sampleRequest = {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      };
      prisma.leadTimelineLog = { create: jest.fn() };
      prisma.activityStream = { create: jest.fn() };

      await service.advanceLeadStage(
        leadId,
        makeAdvanceDto({
          newStatus: WorkflowStatus.SAMPLE_REQUESTED,
          productConcept: 'Test concept',
        }),
      );

      expect(prisma.newProductForm.create).toHaveBeenCalled();
      expect(prisma.sampleRequest.create).toHaveBeenCalled();
    });

    it('creates SalesOrder when SPK_SIGNED', async () => {
      prisma.salesLead.findUnique = jest
        .fn()
        .mockResolvedValue({ ...lead, status: WorkflowStatus.SAMPLE_APPROVED });
      prisma.sampleRequest = {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'SR-1', stage: SampleStage.APPROVED }),
      };
      prisma.salesOrder = { create: jest.fn() };
      prisma.leadTimelineLog = { create: jest.fn() };
      prisma.activityStream = { create: jest.fn() };

      await service.advanceLeadStage(
        leadId,
        makeAdvanceDto({ newStatus: WorkflowStatus.SPK_SIGNED }),
      );
      expect(prisma.salesOrder.create).toHaveBeenCalled();
    });

    it('throws on nonexistent lead', async () => {
      prisma.salesLead.findUnique = jest.fn().mockResolvedValue(null);
      await expect(
        service.advanceLeadStage('VOID', makeAdvanceDto()),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
