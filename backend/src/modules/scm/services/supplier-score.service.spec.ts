import { Test, TestingModule } from '@nestjs/testing';
import { SupplierScoreService } from './supplier-score.service';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

describe('SupplierScoreService', () => {
  let service: SupplierScoreService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      supplier: { findMany: jest.fn(), update: jest.fn() },
      purchaseOrder: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierScoreService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SupplierScoreService>(SupplierScoreService);
  });

  describe('calculateScore', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return 0 when no POs exist', async () => {
      prisma.purchaseOrder.findMany.mockResolvedValue([]);
      const score = await service.calculateScore('s-1');
      expect(score).toBe(0);
    });

    it('should calculate score for supplier with on-time deliveries', async () => {
      const mockPOs = [
        {
          id: 'po-1',
          status: 'RECEIVED',
          estArrival: new Date('2024-01-10'),
          inbounds: [{ receivedAt: new Date('2024-01-09') }],
          items: [{ unitPrice: 100, material: { unitPrice: 95 } }],
        },
        {
          id: 'po-2',
          status: 'RECEIVED',
          estArrival: new Date('2024-01-20'),
          inbounds: [{ receivedAt: new Date('2024-01-22') }],
          items: [{ unitPrice: 100, material: { unitPrice: 100 } }],
        },
      ];
      prisma.purchaseOrder.findMany.mockResolvedValue(mockPOs);

      const score = await service.calculateScore('s-1');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return high score for perfect performance', async () => {
      const mockPOs = [
        {
          id: 'po-1',
          status: 'RECEIVED',
          estArrival: new Date('2024-01-10'),
          inbounds: [{ receivedAt: new Date('2024-01-09') }],
          items: [{ unitPrice: 100, material: { unitPrice: 100 } }],
        },
      ];
      prisma.purchaseOrder.findMany.mockResolvedValue(mockPOs);

      const score = await service.calculateScore('s-1');
      expect(score).toBeGreaterThan(0);
    });

    it('should handle supplier with no inbounds gracefully', async () => {
      const mockPOs = [
        {
          id: 'po-1',
          status: 'ORDERED',
          inbounds: [],
          items: [{ unitPrice: 100, material: { unitPrice: 100 } }],
        },
      ];
      prisma.purchaseOrder.findMany.mockResolvedValue(mockPOs);

      const score = await service.calculateScore('s-1');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should include purchase order relations in query', async () => {
      prisma.purchaseOrder.findMany.mockResolvedValue([]);
      await service.calculateScore('s-1');

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { supplierId: 's-1' },
          include: expect.objectContaining({
            inbounds: true,
            items: expect.objectContaining({
              include: { material: { select: { unitPrice: true } } },
            }),
          }),
        }),
      );
    });
  });

  describe('recalculateAll', () => {
    it('should recalculate scores for all suppliers', async () => {
      prisma.supplier.findMany.mockResolvedValue([
        { id: 's-1' },
        { id: 's-2' },
      ]);
      prisma.purchaseOrder.findMany.mockResolvedValue([]);
      prisma.supplier.update.mockResolvedValue({});

      await service.recalculateAll();

      expect(prisma.supplier.update).toHaveBeenCalledTimes(2);
      expect(prisma.supplier.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 's-1' },
          data: { performanceScore: 0 },
        }),
      );
    });

    it('should handle empty supplier list', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);

      await service.recalculateAll();

      expect(prisma.supplier.update).not.toHaveBeenCalled();
    });
  });
});
