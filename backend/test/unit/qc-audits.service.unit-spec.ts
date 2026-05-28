import { Test, TestingModule } from '@nestjs/testing';
import { QCAuditsService } from '../../src/modules/qc/services/qc-audits.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException } from '@nestjs/common';

jest.mock('bcrypt');
import * as bcrypt from 'bcrypt';

const mockTx = {
  productionStepLog: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  qCParameter: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
  qCAudit: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  materialInventory: { findUnique: jest.fn(), update: jest.fn() },
  inboundItem: { update: jest.fn() },
  workOrder: { findUnique: jest.fn() },
  productionLog: { findFirst: jest.fn() },
  productionPlan: { findUnique: jest.fn() },
  cOPQRecord: { create: jest.fn() },
  supplier: { findMany: jest.fn() },
};

const mockPrisma = {
  $transaction: jest.fn((cb: (tx: any) => any) => cb(mockTx)),
  qCAudit: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn() },
  productionStepLog: { findUnique: jest.fn(), findMany: jest.fn() },
  qCParameter: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
  supplier: { findMany: jest.fn() },
  productionLog: { findFirst: jest.fn() },
  workOrder: { findUnique: jest.fn() },
  productionPlan: { findUnique: jest.fn() },
  materialInventory: { findUnique: jest.fn() },
};

const mockEventEmitter = { emit: jest.fn() };

describe('QCAuditsService — Unit', () => {
  let service: QCAuditsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QCAuditsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<QCAuditsService>(QCAuditsService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a QC audit with GOOD status', async () => {
      const userId = 'user-1';
      const dto = {
        stepLogId: 'step-1',
        status: 'GOOD' as any,
        phase: 'MIXING',
        notes: 'All parameters in spec',
        ph: 6.0,
      };

      mockTx.productionStepLog.findUnique.mockResolvedValue({
        id: 'step-1',
        inputQty: 1000,
        qtyResult: 950,
        wo: { formulaId: 'f-1' },
      });
      mockPrisma.qCParameter.findUnique.mockResolvedValue(null);
      mockTx.qCAudit.create.mockResolvedValue({
        id: 'audit-1',
        status: 'GOOD',
        phase: 'MIXING',
      });

      const result = await service.create(userId, dto);

      expect(result.id).toBe('audit-1');
      expect(result.status).toBe('GOOD');
      expect(mockTx.qCAudit.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'qc.audit.created',
        expect.objectContaining({ status: 'GOOD' }),
      );
    });

    it('creates a QC audit with REJECT status', async () => {
      const userId = 'user-1';
      const dto = {
        stepLogId: 'step-2',
        status: 'REJECT' as any,
        phase: 'FILLING',
        notes: 'pH out of range',
        defectType: 'pH_OUT_OF_SPEC',
        severity: 'MAJOR',
        disposition: 'REWORK',
      };

      mockTx.productionStepLog.findUnique.mockResolvedValue({
        id: 'step-2',
        inputQty: 500,
        qtyResult: 500,
        wo: { formulaId: null },
      });
      mockTx.qCAudit.create.mockResolvedValue({
        id: 'audit-2',
        status: 'REJECT',
        phase: 'FILLING',
      });

      const result = await service.create(userId, dto);

      expect(result.id).toBe('audit-2');
      expect(result.status).toBe('REJECT');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'qc.defect_recorded',
        expect.objectContaining({ defectType: 'pH_OUT_OF_SPEC' }),
      );
    });
  });

  describe('findAll', () => {
    it('returns all audits mapped with reportNumber', async () => {
      const mockAudits = [
        {
          id: 'audit-1-abc',
          status: 'GOOD',
          phase: 'MIXING',
          qc: { fullName: 'Analyst A' },
          phValue: 6.0,
          viscosityValue: null,
          organoleptic: true,
          samplingVolume: null,
          sealingCheck: null,
          labelingCheck: null,
          inkjetCheck: null,
          halalStatus: null,
          densityValue: null,
          homogenityPass: null,
          torqueValue: null,
          leakTestPass: null,
          dimensionCheck: null,
          coaVerified: null,
          defectCategory: null,
          defectType: null,
          defectLocation: null,
          defectCause: null,
          severity: null,
          disposition: null,
          rootCause: null,
          correctiveAction: null,
          materialBatchNo: null,
          supplierId: null,
          notes: 'OK',
          bypassReason: null,
          stepLogId: 'step-1',
          inventoryId: null,
          createdAt: new Date(),
        },
        {
          id: 'audit-2-def',
          status: 'REJECT',
          phase: 'INBOUND',
          qc: { fullName: 'Analyst B' },
          phValue: null,
          viscosityValue: null,
          organoleptic: null,
          samplingVolume: null,
          sealingCheck: null,
          labelingCheck: null,
          inkjetCheck: null,
          halalStatus: null,
          densityValue: null,
          homogenityPass: null,
          torqueValue: null,
          leakTestPass: null,
          dimensionCheck: null,
          coaVerified: null,
          defectCategory: 'FISIK',
          defectType: 'Bocor',
          defectLocation: null,
          defectCause: null,
          severity: 'MAJOR',
          disposition: null,
          rootCause: null,
          correctiveAction: null,
          materialBatchNo: 'BATCH-001',
          supplierId: 's-1',
          notes: 'Leaking container',
          bypassReason: null,
          stepLogId: null,
          inventoryId: 'inv-1',
          createdAt: new Date(),
        },
      ];
      mockPrisma.qCAudit.findMany.mockResolvedValue(mockAudits);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].reportNumber).toBe('AUDIT-1-');
      expect(result[0].status).toBe('PASSED');
      expect(result[1].status).toBe('FAILED');
    });

    it('filters by status when provided', async () => {
      mockPrisma.qCAudit.findMany.mockResolvedValue([]);

      const result = await service.findAll('REJECT');

      expect(result).toEqual([]);
      expect(mockPrisma.qCAudit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'REJECT' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns a single audit by id', async () => {
      const mockAudit = {
        id: 'audit-1',
        status: 'GOOD',
        phase: 'MIXING',
        qc: { fullName: 'Analyst A', email: 'analyst@test.com' },
        notes: 'All OK',
      };
      mockPrisma.qCAudit.findUnique.mockResolvedValue(mockAudit);

      const result = await service.findOne('audit-1');

      expect(result.id).toBe('audit-1');
      expect(result.qc.fullName).toBe('Analyst A');
    });

    it('throws NotFoundException when audit not found', async () => {
      mockPrisma.qCAudit.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDashboard', () => {
    it('returns total, passed, failed, quarantine counts', async () => {
      mockPrisma.qCAudit.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // passed
        .mockResolvedValueOnce(15)  // failed
        .mockResolvedValueOnce(5);  // quarantine

      const result = await service.getDashboard();

      expect(result.total).toBe(100);
      expect(result.passed).toBe(80);
      expect(result.failed).toBe(15);
      expect(result.quarantine).toBe(5);
      expect(result.passRate).toBe('80.0');
    });

    it('returns 0.0 passRate when no audits', async () => {
      mockPrisma.qCAudit.count.mockResolvedValue(0);

      const result = await service.getDashboard();

      expect(result.passRate).toBe('0.0');
    });
  });
});
