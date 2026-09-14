// Wave 2/A3 — StockLedgerService unit tests.
// Pure prisma service. recordMovement takes a tx object (Prisma TransactionClient).
import { StockLedgerService } from '../stock-ledger.service';

describe('StockLedgerService', () => {
  let service: StockLedgerService;
  let prismaMock: any;

  const FAKE_TX_RESULT = {
    id: 'invtx-1',
    materialId: 'mat-1',
    type: 'INBOUND',
    quantity: 100,
  };

  beforeEach(() => {
    prismaMock = {}; // unused — service uses injected tx
    service = new StockLedgerService(prismaMock);
  });

  describe('recordMovement (INBOUND)', () => {
    it('creates an inventoryTransaction + increments materialItem.stockQty', async () => {
      const tx = {
        inventoryTransaction: {
          create: jest.fn().mockResolvedValue(FAKE_TX_RESULT),
        },
        materialItem: {
          update: jest.fn().mockResolvedValue({ id: 'mat-1', stockQty: 100 }),
        },
      };
      const result = await service.recordMovement(tx, {
        materialId: 'mat-1',
        type: 'INBOUND',
        quantity: 100,
      });
      expect(result).toEqual(FAKE_TX_RESULT);
      expect(tx.inventoryTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            materialId: 'mat-1',
            type: 'INBOUND',
            quantity: 100,
            performedBy: 'SYSTEM_LEDGER',
          }),
        }),
      );
      expect(tx.materialItem.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: { stockQty: { increment: 100 } },
      });
    });
  });

  describe('recordMovement (OUTBOUND)', () => {
    it('decrements materialItem.stockQty', async () => {
      const tx = {
        inventoryTransaction: {
          create: jest.fn().mockResolvedValue({ ...FAKE_TX_RESULT, type: 'OUTBOUND' }),
        },
        materialItem: {
          update: jest.fn().mockResolvedValue({ id: 'mat-1', stockQty: 50 }),
        },
      };
      await service.recordMovement(tx, {
        materialId: 'mat-1',
        type: 'OUTBOUND',
        quantity: 50,
      });
      expect(tx.materialItem.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: { stockQty: { increment: -50 } },
      });
    });
  });

  describe('recordMovement (ADJUSTMENT + inventoryId)', () => {
    it('updates the specific materialInventory batch', async () => {
      const tx = {
        inventoryTransaction: {
          create: jest.fn().mockResolvedValue(FAKE_TX_RESULT),
        },
        materialInventory: {
          update: jest.fn().mockResolvedValue({ id: 'inv-1', currentStock: 200 }),
        },
        materialItem: {
          update: jest.fn().mockResolvedValue({ id: 'mat-1', stockQty: 200 }),
        },
      };
      await service.recordMovement(tx, {
        materialId: 'mat-1',
        type: 'ADJUSTMENT',
        quantity: 50,
        inventoryId: 'inv-1',
      });
      expect(tx.materialInventory.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { currentStock: { increment: 50 } },
      });
    });
  });

  describe('recordMovement (DISPOSAL)', () => {
    it('decrements stockQty for disposal', async () => {
      const tx = {
        inventoryTransaction: {
          create: jest.fn().mockResolvedValue(FAKE_TX_RESULT),
        },
        materialItem: { update: jest.fn().mockResolvedValue({}) },
      };
      await service.recordMovement(tx, {
        materialId: 'mat-1',
        type: 'DISPOSAL',
        quantity: 10,
      });
      expect(tx.materialItem.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: { stockQty: { increment: -10 } },
      });
    });
  });

  describe('recordMovement (uses performedBy)', () => {
    it('records the explicit user as performedBy', async () => {
      const tx = {
        inventoryTransaction: {
          create: jest.fn().mockResolvedValue(FAKE_TX_RESULT),
        },
        materialItem: { update: jest.fn().mockResolvedValue({}) },
      };
      await service.recordMovement(tx, {
        materialId: 'mat-1',
        type: 'INBOUND',
        quantity: 5,
        performedBy: 'user-budi',
      });
      expect(tx.inventoryTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ performedBy: 'user-budi' }),
        }),
      );
    });
  });
});
