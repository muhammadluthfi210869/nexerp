import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseInvoicesService } from './purchase-invoices.service';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PurchaseInvoicesService', () => {
  let service: PurchaseInvoicesService;
  let prisma: Record<string, any>;
  let idGenerator: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      warehouseInbound: { findUnique: jest.fn() },
      invoice: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((fn: (...args: any[]) => any) => fn(prisma)),
    };

    idGenerator = { generateId: jest.fn().mockResolvedValue('PI-001') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseInvoicesService,
        { provide: PrismaService, useValue: prisma },
        { provide: IdGeneratorService, useValue: idGenerator },
      ],
    }).compile();

    service = module.get<PurchaseInvoicesService>(PurchaseInvoicesService);
  });

  describe('create', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should throw NotFoundException when inbound not found', async () => {
      prisma.warehouseInbound.findUnique.mockResolvedValue(null);
      await expect(service.create({ inboundId: 'bad-id' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when PO has no items', async () => {
      prisma.warehouseInbound.findUnique.mockResolvedValue({
        id: 'inbound-1',
        poId: 'po-1',
        po: { supplierId: 's-1', items: [] },
        items: [],
      });
      await expect(service.create({ inboundId: 'inbound-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when total amount is zero', async () => {
      prisma.warehouseInbound.findUnique.mockResolvedValue({
        id: 'inbound-1',
        poId: 'po-1',
        po: { supplierId: 's-1', items: [{ totalPrice: 0 }] },
        items: [{ qtyActual: 10 }],
      });
      await expect(service.create({ inboundId: 'inbound-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when poId is null', async () => {
      prisma.warehouseInbound.findUnique.mockResolvedValue({
        id: 'inbound-1',
        poId: null,
        po: null,
        items: [],
      });
      await expect(service.create({ inboundId: 'inbound-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create invoice successfully', async () => {
      prisma.warehouseInbound.findUnique.mockResolvedValue({
        id: 'inbound-1',
        poId: 'po-1',
        po: {
          supplierId: 's-1',
          items: [{ totalPrice: 100000 }],
          supplier: { id: 's-1', name: 'Test Supplier' },
        },
        items: [{ qtyActual: 10, materialId: 'm-1' }],
      });
      prisma.invoice.create.mockResolvedValue({
        id: 'inv-1',
        invoiceNumber: 'PI-001',
        category: 'PAYABLE',
      });

      const result = await service.create({ inboundId: 'inbound-1' });
      expect(result).toBeDefined();
      expect(prisma.invoice.create).toHaveBeenCalled();
    });

    it('should use default 30-day dueDate when not provided', async () => {
      prisma.warehouseInbound.findUnique.mockResolvedValue({
        id: 'inbound-1',
        poId: 'po-1',
        po: {
          supplierId: 's-1',
          items: [{ totalPrice: 50000 }],
          supplier: { id: 's-1', name: 'Test' },
        },
        items: [{ qtyActual: 5, materialId: 'm-1' }],
      });
      prisma.invoice.create.mockResolvedValue({ id: 'inv-1' });

      await service.create({ inboundId: 'inbound-1' });
      const createCall = prisma.invoice.create.mock.calls[0][0];
      expect(createCall.data.dueDate).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all PAYABLE invoices ordered by createdAt desc', async () => {
      const mockInvoices = [
        { id: 'inv-1', category: 'PAYABLE', createdAt: new Date() },
      ];
      prisma.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: 'PAYABLE' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should return empty array when no invoices', async () => {
      prisma.invoice.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when invoice not found', async () => {
      prisma.invoice.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return invoice with relations', async () => {
      const mockInvoice = {
        id: 'inv-1',
        invoiceNumber: 'PI-001',
        supplier: { id: 's-1', name: 'Test' },
        po: { items: [{ material: { name: 'Test Material' } }] },
        payments: [{ id: 'pay-1', amount: 50000 }],
      };
      prisma.invoice.findUnique.mockResolvedValue(mockInvoice);

      const result = await service.findOne('inv-1');
      expect(result).toEqual(mockInvoice);
      expect(prisma.invoice.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          include: expect.objectContaining({
            supplier: true,
            po: expect.objectContaining({
              include: { items: { include: { material: true } } },
            }),
            payments: true,
          }),
        }),
      );
    });
  });
});
