// Wave 2/A3 — FixedAssetsService unit tests.
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FixedAssetsService } from '../fixed-assets.service';

describe('FixedAssetsService', () => {
  let service: FixedAssetsService;
  let prismaMock: any;

  const FAKE_ASSET = {
    id: 'fa-1',
    assetNumber: 'FA-2609-0001',
    assetName: 'Forklift',
    assetCategory: 'EQUIPMENT',
    acquisitionDate: new Date('2026-09-01'),
    acquisitionCost: 5000000,
    usefulLife: 60,
    salvageValue: 500000,
    status: 'ACTIVE',
  };

  beforeEach(() => {
    prismaMock = {
      fixedAsset: {
        findMany: jest.fn().mockResolvedValue([FAKE_ASSET]),
        // Default: not found — uniqueness tests override per-case
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue(FAKE_ASSET),
        update: jest.fn().mockResolvedValue(FAKE_ASSET),
      },
    };
    service = new FixedAssetsService(prismaMock);
  });

  describe('findAll', () => {
    it('returns assets without filter', async () => {
      await service.findAll();
      expect(prismaMock.fixedAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('passes filter to where clause', async () => {
      await service.findAll({ status: 'ACTIVE', category: 'EQUIPMENT' });
      expect(prismaMock.fixedAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE', assetCategory: 'EQUIPMENT' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the asset when found', async () => {
      prismaMock.fixedAsset.findUnique.mockResolvedValueOnce(FAKE_ASSET);
      const result = await service.findOne('fa-1');
      expect(result).toEqual(FAKE_ASSET);
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.fixedAsset.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('auto-generates assetNumber when not provided', async () => {
      const dto = {
        assetName: 'Forklift',
        assetCategory: 'EQUIPMENT',
        acquisitionDate: '2026-09-15',
        acquisitionCost: 5000000,
        usefulLife: 60,
      };
      await service.create('user-1', dto);
      expect(prismaMock.fixedAsset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assetNumber: 'FA-2609-0001',
            assetName: 'Forklift',
          }),
        }),
      );
    });

    it('uses provided assetNumber when given', async () => {
      const dto = {
        assetNumber: 'FA-CUSTOM-1',
        assetName: 'Forklift',
        assetCategory: 'EQUIPMENT',
        acquisitionDate: '2026-09-15',
        acquisitionCost: 5000000,
        usefulLife: 60,
      };
      await service.create('user-1', dto);
      expect(prismaMock.fixedAsset.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ assetNumber: 'FA-CUSTOM-1' }) }),
      );
    });

    it('throws BadRequestException when acquisitionCost <= 0', async () => {
      await expect(
        service.create('user-1', {
          assetName: 'X',
          assetCategory: 'EQUIPMENT',
          acquisitionDate: '2026-09-15',
          acquisitionCost: 0,
          usefulLife: 60,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when usefulLife <= 0', async () => {
      await expect(
        service.create('user-1', {
          assetName: 'X',
          assetCategory: 'EQUIPMENT',
          acquisitionDate: '2026-09-15',
          acquisitionCost: 100,
          usefulLife: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException on duplicate assetNumber', async () => {
      prismaMock.fixedAsset.findUnique.mockResolvedValueOnce(FAKE_ASSET);
      await expect(
        service.create('user-1', {
          assetNumber: 'FA-2609-0001',
          assetName: 'X',
          assetCategory: 'EQUIPMENT',
          acquisitionDate: '2026-09-15',
          acquisitionCost: 100,
          usefulLife: 12,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates the asset metadata when ACTIVE', async () => {
      prismaMock.fixedAsset.findUnique.mockResolvedValueOnce(FAKE_ASSET);
      const result = await service.update('fa-1', { assetName: 'Forklift v2' });
      expect(result).toEqual(FAKE_ASSET);
      expect(prismaMock.fixedAsset.update).toHaveBeenCalledWith({
        where: { id: 'fa-1' },
        data: { assetName: 'Forklift v2' },
      });
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.fixedAsset.findUnique.mockResolvedValueOnce(null);
      await expect(service.update('missing', { assetName: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when status != ACTIVE', async () => {
      prismaMock.fixedAsset.findUnique.mockResolvedValueOnce({ ...FAKE_ASSET, status: 'DISPOSED' });
      await expect(service.update('fa-1', { assetName: 'x' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBookValue', () => {
    it('returns bookValue = cost - accumulated depreciation', async () => {
      prismaMock.fixedAsset.findUnique.mockResolvedValueOnce({
        ...FAKE_ASSET,
        schedules: [{ accumulated: 1000000 }],
      });
      const result = await service.getBookValue('fa-1');
      expect(result.bookValue).toBe(5000000 - 1000000);
      expect(result.accumulatedDepreciation).toBe(1000000);
    });

    it('returns bookValue = cost when no schedules', async () => {
      prismaMock.fixedAsset.findUnique.mockResolvedValueOnce({
        ...FAKE_ASSET,
        schedules: [],
      });
      const result = await service.getBookValue('fa-1');
      expect(result.bookValue).toBe(5000000);
      expect(result.accumulatedDepreciation).toBe(0);
    });

    it('throws NotFoundException when asset missing', async () => {
      prismaMock.fixedAsset.findUnique.mockResolvedValueOnce(null);
      await expect(service.getBookValue('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
