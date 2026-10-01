import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ScmReadinessService } from './scm-readiness.service';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

describe('ScmReadinessService', () => {
  let service: ScmReadinessService;

  const mockPrismaService: Record<string, any> = {
    workOrder: { findMany: jest.fn(), findUnique: jest.fn() },
    materialInventory: { findMany: jest.fn() },
    productionLog: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScmReadinessService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ScmReadinessService>(ScmReadinessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkMaterialReadiness', () => {
    it('should throw NotFoundException if work order is not found', async () => {
      mockPrismaService.workOrder.findUnique.mockResolvedValue(null);
      await expect(service.checkMaterialReadiness('wo-none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return NO_APPROVED_SAMPLE if lead has no approved sample request', async () => {
      mockPrismaService.workOrder.findUnique.mockResolvedValue({
        id: 'wo-1',
        lead: { sampleRequests: [] },
      });

      const res = await service.checkMaterialReadiness('wo-1');
      expect(res.status).toBe('NO_APPROVED_SAMPLE');
      expect(res.details).toEqual([]);
    });

    it('should compute shortage correctly when stock is insufficient', async () => {
      mockPrismaService.workOrder.findUnique.mockResolvedValue({
        id: 'wo-1',
        targetQty: 100,
        lead: {
          sampleRequests: [
            {
              billOfMaterials: [
                {
                  materialId: 'mat-1',
                  quantityPerUnit: 2,
                  material: { name: 'Aloe Vera Extract' },
                },
              ],
            },
          ],
        },
      });

      mockPrismaService.materialInventory.findMany.mockResolvedValue([
        { currentStock: 50 },
      ]);

      const res = await service.checkMaterialReadiness('wo-1');
      expect(res.status).toBe('SHORTAGE');
      expect(res.readinessDetails?.[0]).toEqual({
        materialId: 'mat-1',
        materialName: 'Aloe Vera Extract',
        totalRequired: 200,
        actualStock: 50,
        shortage: 150,
        status: 'SHORTAGE',
      });
    });

    it('should return READY when stock is sufficient', async () => {
      mockPrismaService.workOrder.findUnique.mockResolvedValue({
        id: 'wo-1',
        targetQty: 50,
        lead: {
          sampleRequests: [
            {
              billOfMaterials: [
                {
                  materialId: 'mat-1',
                  quantityPerUnit: 1,
                  material: { name: 'Glycerin' },
                },
              ],
            },
          ],
        },
      });

      mockPrismaService.materialInventory.findMany.mockResolvedValue([
        { currentStock: 100 },
      ]);

      const res = await service.checkMaterialReadiness('wo-1');
      expect(res.status).toBe('READY');
      expect(res.readinessDetails?.[0].shortage).toBe(0);
    });
  });
});
