import { Test, TestingModule } from '@nestjs/testing';
import { BussdevController } from '../../src/modules/bussdev/bussdev.controller';
import { BussdevService } from '../../src/modules/bussdev/bussdev.service';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/modules/auth/roles.guard';
import { UserRole, WorkflowStatus } from '@prisma/client';

describe('BussdevController — Unit', () => {
  let controller: BussdevController;
  let service: jest.Mocked<BussdevService>;

  const mockService = {
    createLead: jest.fn(),
    advanceLeadStage: jest.fn(),
    getPageAnalytics: jest.fn(),
    getFunnelAnalytics: jest.fn(),
    getGranularPipelineTable: jest.fn(),
    getBDPerformance: jest.fn(),
    getLostChurnTable: jest.fn(),
    getLeads: jest.fn(),
    getLeadsByGroup: jest.fn(),
    getStuckLeads: jest.fn(),
    getStaffs: jest.fn(),
    getClientSamples: jest.fn(),
    shipSample: jest.fn(),
    submitSampleFeedback: jest.fn(),
    logActivity: jest.fn(),
    getActivityStream: jest.fn(),
    getLeadBalance: jest.fn(),
    convertGuestToLead: jest.fn(),
    updateSalesOrderStatus: jest.fn(),
    emergencyOverride: jest.fn(),
    triggerRetentionCheck: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BussdevController],
      providers: [{ provide: BussdevService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BussdevController>(BussdevController);
    service = module.get(BussdevService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('guards', () => {
    it('controller has JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', BussdevController);
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);
    });
  });

  describe('POST /bussdev/lead', () => {
    it('creates a lead', async () => {
      const dto = {
        clientName: 'Test Client',
        brandName: 'Test Brand',
        contactInfo: 'test@test.com',
        source: 'REFERRAL',
        productInterest: 'Skincare',
        estimatedValue: 100000000,
      };
      mockService.createLead.mockResolvedValue({ id: 'LEAD-1', ...dto });

      const result = await controller.createLead(dto);
      expect(result).toMatchObject({ id: 'LEAD-1', clientName: 'Test Client' });
      expect(mockService.createLead).toHaveBeenCalledWith(dto);
    });

    it('has correct role decorator', () => {
      const roles = Reflect.getMetadata(
        'roles',
        BussdevController.prototype.createLead.bind(
          BussdevController.prototype,
        ),
      );
      expect(roles).toEqual([UserRole.COMMERCIAL, UserRole.SUPER_ADMIN]);
    });
  });

  describe('PATCH /bussdev/lead/:id/advance', () => {
    it('advances a lead stage with files', async () => {
      const dto = {
        action: 'STAGE_UPDATED' as const,
        newStatus: WorkflowStatus.CONTACTED,
        notes: 'Test',
        loggedBy: 'User',
      };
      const files = {
        paymentProof: [
          {
            path: '/uploads/proof.jpg',
            fieldname: 'paymentProof',
            originalname: 'proof.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            size: 1000,
            stream: null as any,
            destination: '',
            filename: 'proof.jpg',
            buffer: Buffer.alloc(0),
          } as Express.Multer.File,
        ],
        spkFile: [
          {
            path: '/uploads/spk.pdf',
            fieldname: 'spkFile',
            originalname: 'spk.pdf',
            encoding: '7bit',
            mimetype: 'application/pdf',
            size: 2000,
            stream: null as any,
            destination: '',
            filename: 'spk.pdf',
            buffer: Buffer.alloc(0),
          } as Express.Multer.File,
        ],
      };
      mockService.advanceLeadStage.mockResolvedValue({
        id: 'LEAD-1',
        status: WorkflowStatus.CONTACTED,
      });

      const result = await controller.advanceLead('LEAD-1', dto, files as any);
      expect(result.status).toBe(WorkflowStatus.CONTACTED);
      expect(mockService.advanceLeadStage).toHaveBeenCalledWith(
        'LEAD-1',
        dto,
        files,
      );
    });

    it('has correct role decorator', () => {
      const roles = Reflect.getMetadata(
        'roles',
        BussdevController.prototype.advanceLead.bind(
          BussdevController.prototype,
        ),
      );
      expect(roles).toEqual([UserRole.COMMERCIAL, UserRole.SUPER_ADMIN]);
    });
  });

  describe('GET /bussdev/dashboard', () => {
    it('returns dashboard analytics', async () => {
      mockService.getPageAnalytics.mockResolvedValue({ overview: {} });
      const result = await controller.getDashboard();
      expect(result).toEqual({ overview: {} });
      expect(mockService.getPageAnalytics).toHaveBeenCalledWith('dashboard');
    });
  });

  describe('GET /bussdev/analytics/funnel', () => {
    it('returns funnel analytics', async () => {
      mockService.getFunnelAnalytics.mockResolvedValue({ counts: {} });
      const result = await controller.getFunnelAnalytics();
      expect(result).toEqual({ counts: {} });
    });
  });

  describe('GET /bussdev/analytics/pipeline-granular', () => {
    it('returns granular pipeline table', async () => {
      mockService.getGranularPipelineTable.mockResolvedValue([]);
      const result = await controller.getGranularPipelineTable();
      expect(result).toEqual([]);
    });
  });

  describe('GET /bussdev/analytics/staff-performance', () => {
    it('returns BD performance', async () => {
      mockService.getBDPerformance.mockResolvedValue([]);
      const result = await controller.getBDPerformance();
      expect(result).toEqual([]);
    });
  });

  describe('GET /bussdev/analytics/lost-churn', () => {
    it('returns lost churn table', async () => {
      mockService.getLostChurnTable.mockResolvedValue([]);
      const result = await controller.getLostChurnTable();
      expect(result).toEqual([]);
    });
  });

  describe('GET /bussdev/analytics/:group', () => {
    it('returns page analytics for a group', async () => {
      mockService.getPageAnalytics.mockResolvedValue({});
      const result = await controller.getPageAnalytics('sample');
      expect(mockService.getPageAnalytics).toHaveBeenCalledWith('sample');
    });
  });

  describe('GET /bussdev/leads', () => {
    it('returns all leads', async () => {
      const mockLeads = [{ id: 'L1', clientName: 'Client A' }];
      mockService.getLeads.mockResolvedValue(mockLeads);
      const result = await controller.getLeads();
      expect(result).toHaveLength(1);
    });
  });

  describe('GET /bussdev/leads/stuck', () => {
    it('returns stuck leads', async () => {
      mockService.getStuckLeads.mockResolvedValue([]);
      const result = await controller.getStuckLeads();
      expect(result).toEqual([]);
    });
  });

  describe('GET /bussdev/leads/group/:group', () => {
    it('returns leads by group', async () => {
      mockService.getLeadsByGroup.mockResolvedValue([]);
      const result = await controller.getLeadsByGroup('guest');
      expect(mockService.getLeadsByGroup).toHaveBeenCalledWith('guest');
    });
  });

  describe('GET /bussdev/staffs', () => {
    it('returns staffs', async () => {
      mockService.getStaffs.mockResolvedValue([]);
      const result = await controller.getStaffs();
      expect(result).toEqual([]);
    });
  });

  describe('GET /bussdev/samples', () => {
    it('returns client samples', async () => {
      mockService.getClientSamples.mockResolvedValue([]);
      const result = await controller.getClientSamples();
      expect(result).toEqual([]);
    });
  });

  describe('PATCH /bussdev/sample/:id/ship', () => {
    it('ships a sample', async () => {
      const dto = { courierName: 'JNE', trackingNumber: 'TRK-001' };
      mockService.shipSample.mockResolvedValue({ id: 'SR-1' });

      const result = await controller.shipSample('SR-1', dto);
      expect(mockService.shipSample).toHaveBeenCalledWith('SR-1', dto);
    });
  });

  describe('PATCH /bussdev/sample/:id/feedback', () => {
    it('submits sample feedback', async () => {
      const dto = { rating: 4, comment: 'Good', status: 'APPROVED' as const };
      mockService.submitSampleFeedback.mockResolvedValue({ id: 'SR-1' });

      await controller.submitFeedback('SR-1', dto);
      expect(mockService.submitSampleFeedback).toHaveBeenCalledWith(
        'SR-1',
        dto,
      );
    });
  });

  describe('POST /bussdev/lead/:id/activity', () => {
    it('logs activity for a lead', async () => {
      const dto = { activityType: 'CHAT', notes: 'Test' };
      mockService.logActivity.mockResolvedValue({ id: 'ACT-1' });

      await controller.logActivity('LEAD-1', dto);
      expect(mockService.logActivity).toHaveBeenCalledWith({
        leadId: 'LEAD-1',
        ...dto,
      });
    });
  });

  describe('GET /bussdev/lead/:id/activity-stream', () => {
    it('returns activity stream', async () => {
      mockService.getActivityStream.mockResolvedValue([]);
      const result = await controller.getActivityStream('LEAD-1');
      expect(mockService.getActivityStream).toHaveBeenCalledWith('LEAD-1');
    });
  });

  describe('GET /bussdev/lead/:id/balance', () => {
    it('returns lead balance', async () => {
      const balance = {
        totalEstimated: 100000000,
        totalPaid: 50000000,
        balance: 50000000,
      };
      mockService.getLeadBalance.mockResolvedValue(balance);
      const result = await controller.getLeadBalance('LEAD-1');
      expect(result.balance).toBe(50000000);
    });
  });

  describe('POST /bussdev/guest/:id/convert', () => {
    it('converts guest to lead', async () => {
      mockService.convertGuestToLead.mockResolvedValue({ id: 'LEAD-1' });
      const result = await controller.convertGuestToLead('GUEST-1');
      expect(mockService.convertGuestToLead).toHaveBeenCalledWith('GUEST-1');
    });
  });

  describe('PATCH /bussdev/sales-order/:id/status', () => {
    it('updates SO status', async () => {
      const dto = { status: 'ACTIVE' as any, loggedBy: 'User' };
      mockService.updateSalesOrderStatus.mockResolvedValue({ id: 'SO-1' });

      await controller.updateSoStatus('SO-1', dto);
      expect(mockService.updateSalesOrderStatus).toHaveBeenCalledWith(
        'SO-1',
        dto.status,
        dto.loggedBy,
      );
    });
  });

  describe('PATCH /bussdev/lead/:id/override', () => {
    it('activates emergency override', async () => {
      const dto = { note: 'Emergency', loggedBy: 'Admin' };
      mockService.emergencyOverride.mockResolvedValue({
        id: 'LEAD-1',
        isEmergencyOverride: true,
      });

      const result = await controller.emergencyOverride('LEAD-1', dto);
      expect(result.isEmergencyOverride).toBe(true);
      expect(mockService.emergencyOverride).toHaveBeenCalledWith(
        'LEAD-1',
        'Emergency',
        'Admin',
      );
    });

    it('is restricted to SUPER_ADMIN', () => {
      const roles = Reflect.getMetadata(
        'roles',
        BussdevController.prototype.emergencyOverride.bind(
          BussdevController.prototype,
        ),
      );
      expect(roles).toEqual([UserRole.SUPER_ADMIN]);
    });
  });

  describe('POST /bussdev/retention-engine/:id/trigger', () => {
    it('triggers retention check', async () => {
      mockService.triggerRetentionCheck.mockResolvedValue({
        status: 'WAITING',
      });
      const result = await controller.triggerRetention('LEAD-1');
      expect(result.status).toBe('WAITING');
    });
  });
});
