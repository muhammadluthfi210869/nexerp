// Wave 2/A3 — IdGeneratorService unit tests.
// Generates PREFIX-YYMM-SEQ via systemSequence.upsert.
import { IdGeneratorService } from '../id-generator.service';

describe('IdGeneratorService', () => {
  let service: IdGeneratorService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      $transaction: jest.fn(),
    };
    // Default $transaction: upsert returns sequence with lastValue
    prismaMock.$transaction.mockImplementation(async (cb: any) =>
      cb({
        systemSequence: {
          upsert: jest.fn().mockImplementation(({ update, create }) => {
            // simulate update path: increment from current value
            if (update?.lastValue?.increment !== undefined) {
              return Promise.resolve({ lastValue: 1, ...create });
            }
            return Promise.resolve({ lastValue: create.lastValue });
          }),
        },
      }),
    );
    service = new IdGeneratorService(prismaMock);
  });

  describe('generateId', () => {
    it('returns PREFIX-YYMM-001 on first call', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) =>
        cb({
          systemSequence: {
            upsert: jest.fn().mockResolvedValue({ lastValue: 1 }),
          },
        }),
      );
      const result = await service.generateId('SO');
      expect(result).toMatch(/^SO-\d{4}-001$/);
    });

    it('pads seq to seqLength (default 3)', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) =>
        cb({
          systemSequence: {
            upsert: jest.fn().mockResolvedValue({ lastValue: 7 }),
          },
        }),
      );
      const result = await service.generateId('PO');
      expect(result).toMatch(/^PO-\d{4}-007$/);
    });

    it('respects seqLength parameter', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) =>
        cb({
          systemSequence: {
            upsert: jest.fn().mockResolvedValue({ lastValue: 42 }),
          },
        }),
      );
      const result = await service.generateId('BMR', 5);
      expect(result).toMatch(/^BMR-\d{4}-00042$/);
    });

    it('uses upsert with prefix_period compound key', async () => {
      const upsertMock = jest.fn().mockResolvedValue({ lastValue: 1 });
      prismaMock.$transaction.mockImplementation(async (cb: any) =>
        cb({ systemSequence: { upsert: upsertMock } }),
      );
      await service.generateId('SO');
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            prefix_period: expect.objectContaining({ prefix: 'SO' }),
          }),
          update: { lastValue: { increment: 1 } },
        }),
      );
    });
  });

  describe('generateStageId', () => {
    it('maps MIXING -> MIX prefix', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) =>
        cb({
          systemSequence: {
            upsert: jest.fn().mockResolvedValue({ lastValue: 1 }),
          },
        }),
      );
      const result = await service.generateStageId('MIXING');
      expect(result).toMatch(/^MIX-\d{4}-001$/);
    });

    it('maps FILLING -> FIL prefix', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) =>
        cb({
          systemSequence: {
            upsert: jest.fn().mockResolvedValue({ lastValue: 1 }),
          },
        }),
      );
      const result = await service.generateStageId('FILLING');
      expect(result).toMatch(/^FIL-\d{4}-001$/);
    });

    it('uses 3-char uppercase prefix for unknown stages', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) =>
        cb({
          systemSequence: {
            upsert: jest.fn().mockResolvedValue({ lastValue: 1 }),
          },
        }),
      );
      const result = await service.generateStageId('extrusion');
      expect(result).toMatch(/^EXT-\d{4}-001$/);
    });
  });
});
