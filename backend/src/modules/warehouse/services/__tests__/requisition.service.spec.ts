// Wave 2/A3 — RequisitionService unit tests.
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RequisitionService } from '../requisition.service';

describe('RequisitionService', () => {
  let service: RequisitionService;
  let prismaMock: any;
  let idGeneratorMock: any;

  const FAKE_REQ = {
    id: 'req-1',
    reqNumber: 'REQ-2609-001',
    status: 'PENDING',
    fromWarehouse: 'wh-1',
    toWarehouse: 'wh-2',
    items: [],
  };

  beforeEach(() => {
    prismaMock = {
      materialRequisitionHeader: {
        findMany: jest.fn().mockResolvedValue([FAKE_REQ]),
        findUnique: jest.fn().mockResolvedValue(FAKE_REQ),
        create: jest.fn().mockResolvedValue(FAKE_REQ),
        update: jest.fn().mockResolvedValue({ ...FAKE_REQ, status: 'APPROVED' }),
      },
      $transaction: jest.fn(),
    };
    idGeneratorMock = { generateId: jest.fn().mockResolvedValue('REQ-2609-001') };
    service = new RequisitionService(prismaMock, idGeneratorMock);
  });

  describe('create', () => {
    it('generates reqNumber via idGenerator + creates header', async () => {
      // Default $transaction: run callback with tx
      prismaMock.$transaction.mockImplementation(async (cb: any) =>
        cb({
          materialRequisitionHeader: {
            create: jest.fn().mockResolvedValue(FAKE_REQ),
          },
        }),
      );
      const dto = {
        fromWarehouse: 'wh-1',
        toWarehouse: 'wh-2',
        items: [{ materialId: 'mat-1', qty: 5 }],
      };
      await service.create(dto, 'user-1');
      expect(idGeneratorMock.generateId).toHaveBeenCalledWith('REQ');
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns all requisitions ordered by createdAt desc', async () => {
      const result = await service.findAll();
      expect(result).toEqual([FAKE_REQ]);
      expect(prismaMock.materialRequisitionHeader.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns the requisition when found', async () => {
      const result = await service.findOne('req-1');
      expect(result).toEqual(FAKE_REQ);
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.materialRequisitionHeader.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('transitions PENDING -> APPROVED', async () => {
      const result = await service.updateStatus('req-1', { status: 'APPROVED' });
      expect((result as any).status).toBe('APPROVED');
    });

    it('transitions APPROVED -> FULFILLED', async () => {
      prismaMock.materialRequisitionHeader.findUnique.mockResolvedValueOnce({
        ...FAKE_REQ,
        status: 'APPROVED',
      });
      prismaMock.materialRequisitionHeader.update.mockResolvedValueOnce({
        ...FAKE_REQ,
        status: 'FULFILLED',
      });
      const result = await service.updateStatus('req-1', { status: 'FULFILLED' });
      expect((result as any).status).toBe('FULFILLED');
    });

    it('throws BadRequestException on illegal transition', async () => {
      prismaMock.materialRequisitionHeader.findUnique.mockResolvedValueOnce({
        ...FAKE_REQ,
        status: 'FULFILLED',
      });
      await expect(service.updateStatus('req-1', { status: 'PENDING' })).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.materialRequisitionHeader.findUnique.mockResolvedValueOnce(null);
      await expect(service.updateStatus('missing', { status: 'APPROVED' })).rejects.toThrow(NotFoundException);
    });
  });
});
