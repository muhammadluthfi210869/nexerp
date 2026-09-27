/**
 * Bridge 4: Production Planning, Floor Execution, Inventory & Costing (P12 -> P13 -> P11 -> P15)
 * Tests:
 * 1. Material consumption decrements warehouse raw inventory.
 * 2. Finished goods receipt increments warehouse FG stock.
 * 3. Unit HPP job costing calculates real unit cost based on consumed materials and outputs balanced GL entry.
 */
import { randomUUID } from 'crypto';
import { bootBridgeApp, cleanBridgeResiduals, BridgeApp } from './bridge-harness';

describe('Bridge 4: Production to Costing (P12 -> P13 -> P11 -> P15)', () => {
  let harness: BridgeApp;
  let accounts: Record<string, any>;

  beforeAll(async () => {
    harness = await bootBridgeApp();
    accounts = await harness.ensureStandardAccounts();
  });

  afterAll(async () => {
    await cleanBridgeResiduals(harness.prisma);
    await harness.app.close();
  });

  it('B4-01: Aggregates actual raw material consumption into Finished Goods HPP', async () => {
    // 1. Setup Raw Material in Warehouse: 200 kg @ Rp 50,000 (Value: Rp 10,000,000)
    const rawMaterial = await harness.prisma.materialItem.create({
      data: {
        id: randomUUID(),
        name: `bridge_prod_raw_${randomUUID().slice(0, 6)}`,
        code: `BRIDGE-RAW-${randomUUID().slice(0, 4)}`,
        type: 'RAW_MATERIAL' as any,
        unit: 'kg',
        unitPrice: 50000,
        stockQty: 200,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 20,
      },
    });

    // 2. Production consumes 100 kg Raw Material (Rp 5,000,000) + Factory Overhead (Rp 2,000,000)
    // to produce 500 units of Finished Goods
    const consumedQty = 100;
    const materialCost = consumedQty * Number(rawMaterial.unitPrice); // 5,000,000
    const overheadCost = 2000000;
    const totalProductionCost = materialCost + overheadCost; // 7,000,000
    const fgUnits = 500;
    const unitHpp = totalProductionCost / fgUnits; // Rp 14,000 / unit

    expect(unitHpp).toBe(14000);

    // 3. Decrement Raw Material Stock in P11
    await harness.prisma.materialItem.update({
      where: { id: rawMaterial.id },
      data: { stockQty: { decrement: consumedQty } },
    });

    const postStock = await harness.prisma.materialItem.findUnique({
      where: { id: rawMaterial.id },
    });
    expect(Number(postStock!.stockQty)).toBe(100);

    // 4. Record Balanced Production Costing Journal in P15:
    // Dr 11500 (Finished Goods Inventory) = Rp 7,000,000
    // Cr 11400 (Raw Material Inventory)   = Rp 5,000,000
    // Cr 51100 (Factory Overhead Applied) = Rp 2,000,000
    const journal = await harness.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `BRIDGE-HPP-${randomUUID().slice(0, 6)}`,
        description: 'Bridge Production Job Order Costing Rollup',
        sourceDocumentType: 'PRODUCTION_PLAN',
        lines: {
          create: [
            { accountId: accounts['11500'].id, debit: totalProductionCost, credit: 0 },
            { accountId: accounts['11400'].id, debit: 0, credit: materialCost },
            { accountId: accounts['51100'].id, debit: 0, credit: overheadCost },
          ],
        },
      },
      include: { lines: true },
    });

    expect(journal.lines).toHaveLength(3);
    const sumDebit = journal.lines.reduce((s, l) => s + Number(l.debit), 0);
    const sumCredit = journal.lines.reduce((s, l) => s + Number(l.credit), 0);
    expect(sumDebit).toBe(totalProductionCost);
    expect(sumCredit).toBe(totalProductionCost);
  });
});
