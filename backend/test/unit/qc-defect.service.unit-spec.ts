import { Test, TestingModule } from '@nestjs/testing';
import { QcDefectService } from '../../src/modules/qc/services/qc-defect.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';

const mockPrisma = {
  qCAudit: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn() },
  supplier: { findMany: jest.fn() },
};

describe('QcDefectService — Unit', () => {
  let service: QcDefectService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QcDefectService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<QcDefectService>(QcDefectService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('calculates QC metrics and passRate accurately', async () => {
      mockPrisma.qCAudit.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // passed
        .mockResolvedValueOnce(1)  // failed
        .mockResolvedValueOnce(1); // quarantine

      const result = await service.getDashboard();

      expect(result).toEqual({
        total: 10,
        passed: 8,
        failed: 1,
        quarantine: 1,
        passRate: '80.0',
      });
    });
  });

  describe('getDefectPareto', () => {
    it('aggregates defect counts and sorts by frequency', async () => {
      mockPrisma.qCAudit.findMany.mockResolvedValue([
        { defectType: 'Bocor', defectCategory: 'PACKAGING' },
        { defectType: 'Bocor', defectCategory: 'PACKAGING' },
        { defectType: 'pH_OUT_OF_SPEC', defectCategory: 'CHEMICAL' },
      ]);

      const result = await service.getDefectPareto();

      expect(result).toEqual([
        { defect: 'Bocor', count: 2, percentage: 67 },
        { defect: 'pH_OUT_OF_SPEC', count: 1, percentage: 33 },
      ]);
    });
  });
});
