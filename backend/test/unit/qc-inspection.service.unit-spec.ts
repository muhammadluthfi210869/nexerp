import { Test, TestingModule } from '@nestjs/testing';
import { QcInspectionService } from '../../src/modules/qc/services/qc-inspection.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException } from '@nestjs/common';

jest.mock('bcrypt');

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

describe('QcInspectionService — Unit', () => {
  let service: QcInspectionService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QcInspectionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<QcInspectionService>(QcInspectionService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates an incoming inspection with GOOD status', async () => {
      const userId = 'user-1';
      const dto = {
        inventoryId: 'inv-1',
        status: 'GOOD' as any,
        notes: 'Material clean',
      } as any;

      mockTx.materialInventory.findUnique.mockResolvedValue({ id: 'inv-1' });
      mockTx.materialInventory.update.mockResolvedValue({ id: 'inv-1', qcStatus: 'GOOD' });
      mockTx.qCAudit.create.mockResolvedValue({
        id: 'audit-inv-1',
        status: 'GOOD',
        phase: 'INBOUND',
      });

      const result = await service.create(userId, dto);

      expect(result.id).toBe('audit-inv-1');
      expect(result.status).toBe('GOOD');
      expect(mockTx.materialInventory.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { qcStatus: 'GOOD' },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'qc.audit.created',
        expect.objectContaining({ status: 'GOOD' }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when audit not found', async () => {
      mockPrisma.qCAudit.findUnique.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
