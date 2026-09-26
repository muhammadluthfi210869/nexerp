/**
 * P21 Data Migration Pipeline (AC-P21-01)
 *
 * Proves the governed import path (`ImportExportService`) can absorb a real
 * client cut-over load and refuses everything it should refuse:
 *
 *   1. 10.000 baris master data in one atomic batch — zero corrupt rows.
 *   2. Duplicate SKU inside a batch — rejected, nothing written.
 *   3. Opening balance (saldo awal COA) — unregistered account and unbalanced
 *      batch both rejected; a valid batch posts ONE balanced journal.
 *   4. Opening stock (stok awal gudang) — unknown material rejected; a valid
 *      batch leaves inventory ledger and the material stock cache consistent.
 *   5. Replay of the same idempotency key returns the durable result and
 *      writes nothing a second time.
 *
 * Every assertion reads real PostgreSQL state through PrismaService — no mocks.
 * The import runs through the real application service (Policy -> Audit ->
 * Outbox -> journal balance guard), not a bypass path.
 */
import { randomUUID } from 'crypto';
import { bootP20App, P20App } from '../p20/p20-http-harness';
import { ImportExportService } from '../../src/modules/master/services/import-export.service';

describe('P21 Migration Pipeline: master data load & rejection gates (AC-P21-01)', () => {
  let harness: P20App;
  let importer: ImportExportService;
  let actor: { id: string; roles: string[]; organizationId: string };

  const runId = randomUUID().slice(0, 6).toUpperCase();
  const codePrefix = `P21-${runId}`;

  const MASTER_ROWS = 10_000;

  /** Journals written by this suite are traceable by the idempotency key. */
  const journalFilter = { description: { contains: codePrefix } };

  beforeAll(async () => {
    harness = await bootP20App();
    importer = harness.app.get(ImportExportService);
    await harness.ensureStandardAccounts();

    const { user } = await harness.createUser(`MIG_${runId}`, ['SUPER_ADMIN']);
    actor = { id: user.id, roles: ['SUPER_ADMIN'], organizationId: randomUUID() };
  }, 120_000);

  afterAll(async () => {
    const prisma = harness.prisma;
    await prisma.inventoryTransaction.deleteMany({
      where: { material: { code: { startsWith: codePrefix } } },
    });
    await prisma.materialInventory.deleteMany({
      where: { material: { code: { startsWith: codePrefix } } },
    });
    await prisma.journalLine.deleteMany({ where: { journal: journalFilter } });
    await prisma.journalEntry.deleteMany({ where: journalFilter });
    await prisma.importExecution.deleteMany({ where: { idempotencyKey: { contains: codePrefix } } });
    await prisma.materialItem.deleteMany({ where: { code: { startsWith: codePrefix } } });
    await prisma.supplier.deleteMany({ where: { name: 'OPENING-BALANCE (SYSTEM)' } });
    await prisma.user.deleteMany({ where: { id: actor.id } });
    await harness.app.close();
  }, 120_000);

  it('1. Imports 10.000 master rows atomically with zero data corruption', async () => {
    const rows = Array.from({ length: MASTER_ROWS }, (_, i) => ({
      code: `${codePrefix}-MAT-${String(i).padStart(5, '0')}`,
      name: `Migrated Material ${i}`,
      type: 'RAW_MATERIAL',
      unit: 'KG',
      unitPrice: 1000 + i,
    }));

    const startedAt = Date.now();
    const result = await importer.importData('material', rows, {
      actor,
      idempotencyKey: `${codePrefix}-bulk-master`,
    });
    const elapsedMs = Date.now() - startedAt;

    expect(result.success).toBe(true);
    expect(result.totalRows).toBe(MASTER_ROWS);
    expect(result.importedRows).toBe(MASTER_ROWS);
    expect(result.errors).toHaveLength(0);

    // Every row landed, exactly once.
    const persisted = await harness.prisma.materialItem.count({
      where: { code: { startsWith: codePrefix } },
    });
    expect(persisted).toBe(MASTER_ROWS);

    // Corruption check: verify the field values actually round-tripped.
    const corruptionProbe = await harness.prisma.materialItem.count({
      where: {
        code: { startsWith: codePrefix },
        OR: [
          { name: { not: { startsWith: 'Migrated Material' } } },
          { unit: { not: 'KG' } },
          { unitPrice: { lt: 1000 } },
          { unitPrice: { gt: 1000 + MASTER_ROWS } },
        ],
      },
    });
    expect(corruptionProbe).toBe(0);

    // Field-level spot check on a midpoint row.
    const midpoint = await harness.prisma.materialItem.findUnique({
      where: { code: `${codePrefix}-MAT-05000` },
    });
    expect(midpoint).not.toBeNull();
    expect(midpoint!.name).toBe('Migrated Material 5000');
    expect(Number(midpoint!.unitPrice)).toBe(6000);

    // Audit + outbox effects are part of the same transaction, not best-effort.
    const auditRows = await harness.prisma.auditLog.count({
      where: { idempotencyKey: `${codePrefix}-bulk-master` },
    });
    expect(auditRows).toBe(1);

    // eslint-disable-next-line no-console
    console.log(`[P21] 10.000-row master import committed in ${(elapsedMs / 1000).toFixed(1)}s`);
  }, 900_000);

  it('2. Rejects a batch that lists the same SKU twice and writes nothing', async () => {
    const before = await harness.prisma.materialItem.count({ where: { code: { startsWith: codePrefix } } });

    const duplicateCode = `${codePrefix}-DUP-001`;
    await expect(
      importer.importData(
        'material',
        [
          { code: duplicateCode, name: 'Duplicate A', type: 'RAW_MATERIAL', unit: 'KG', unitPrice: 10 },
          { code: duplicateCode, name: 'Duplicate B', type: 'RAW_MATERIAL', unit: 'KG', unitPrice: 20 },
        ],
        { actor, idempotencyKey: `${codePrefix}-dup` }
      )
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'IMPORT_VALIDATION_FAILED' }),
    });

    const after = await harness.prisma.materialItem.count({ where: { code: { startsWith: codePrefix } } });
    expect(after).toBe(before);
    expect(await harness.prisma.materialItem.findUnique({ where: { code: duplicateCode } })).toBeNull();
  }, 120_000);

  it('3. Rejects unregistered COA accounts and unbalanced opening balances; posts one balanced journal for a valid batch', async () => {
    const unregisteredCode = `${codePrefix}-9999`;

    await expect(
      importer.importData(
        'openingbalance',
        [
          { code: '1110', debit: 5_000_000, credit: 0 },
          { code: unregisteredCode, debit: 0, credit: 5_000_000 },
        ],
        { actor, idempotencyKey: `${codePrefix}-ob-unmapped` }
      )
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        message: expect.stringContaining('COA_NOT_REGISTERED'),
      }),
    });

    // No journal may exist for a rejected batch. Anchored by the assertion at
    // the end of this test that the filter does match the valid batch's journal.
    expect(await harness.prisma.journalEntry.count({ where: journalFilter })).toBe(0);

    await expect(
      importer.importData(
        'openingbalance',
        [
          { code: '1110', debit: 5_000_000, credit: 0 },
          { code: '4101', debit: 0, credit: 4_000_000 },
        ],
        { actor, idempotencyKey: `${codePrefix}-ob-unbalanced` }
      )
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        message: expect.stringContaining('OPENING_BALANCE_UNBALANCED'),
      }),
    });

    expect(await harness.prisma.journalEntry.count({ where: journalFilter })).toBe(0);

    // Valid, balanced batch: one journal, debits == credits.
    const valid = await importer.importData(
      'openingbalance',
      [
        { code: '1110', debit: 5_000_000, credit: 0, date: '2026-01-01' },
        { code: '4101', debit: 0, credit: 5_000_000, date: '2026-01-01' },
      ],
      { actor, idempotencyKey: `${codePrefix}-ob-valid` }
    );
    expect(valid.importedRows).toBe(2);

    const journal = await harness.prisma.journalEntry.findFirst({
      where: { description: { contains: `${codePrefix}-ob-valid` } },
      include: { lines: true },
    });
    expect(journal).not.toBeNull();
    // Anchors `journalFilter` above: the filter really does match a written
    // journal, so the two "count == 0" assertions were not vacuous.
    expect(await harness.prisma.journalEntry.count({ where: journalFilter })).toBe(1);
    expect(journal!.description).toContain(`${codePrefix}-ob-valid`);
    expect(journal!.lines).toHaveLength(2);

    const debit = journal!.lines.reduce((s, l) => s + Number(l.debit), 0);
    const credit = journal!.lines.reduce((s, l) => s + Number(l.credit), 0);
    expect(debit).toBe(5_000_000);
    expect(Math.abs(debit - credit)).toBeLessThanOrEqual(0.01);

    const lines = journal!.lines.map((l) => `${l.accountId}:${Number(l.debit)}:${Number(l.credit)}`).sort();
    expect(lines).toHaveLength(2);
  }, 180_000);

  it('4. Rejects opening stock for unknown materials and keeps ledger vs stock cache consistent', async () => {
    await expect(
      importer.importData(
        'openingstock',
        [{ code: `${codePrefix}-NOT-A-MATERIAL`, batchNumber: 'X-1', quantity: 10 }],
        { actor, idempotencyKey: `${codePrefix}-os-unknown` }
      )
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        message: expect.stringContaining('MATERIAL_NOT_REGISTERED'),
      }),
    });

    const materialCode = `${codePrefix}-MAT-00001`;
    const before = await harness.prisma.materialItem.findUnique({ where: { code: materialCode } });
    const stockBefore = Number(before!.stockQty);

    const result = await importer.importData(
      'openingstock',
      [
        { code: materialCode, batchNumber: `${codePrefix}-LOT-A`, quantity: 250, unitPrice: 1200, expDate: '2028-12-31' },
        { code: materialCode, batchNumber: `${codePrefix}-LOT-B`, quantity: 150, unitPrice: 1250 },
      ],
      { actor, idempotencyKey: `${codePrefix}-os-valid` }
    );
    expect(result.importedRows).toBe(2);

    const after = await harness.prisma.materialItem.findUnique({ where: { code: materialCode } });
    expect(Number(after!.stockQty)).toBe(stockBefore + 400);

    const batches = await harness.prisma.materialInventory.findMany({
      where: { materialId: after!.id, batchNumber: { startsWith: codePrefix } },
      orderBy: { batchNumber: 'asc' },
    });
    expect(batches).toHaveLength(2);
    expect(batches.map((b) => Number(b.currentStock))).toEqual([250, 150]);

    const ledger = await harness.prisma.inventoryTransaction.findMany({
      where: { materialId: after!.id, inventoryId: { in: batches.map((b) => b.id) } },
    });
    expect(ledger).toHaveLength(2);
    expect(ledger.every((t) => t.type === 'INBOUND')).toBe(true);

    // Conservation: ledger inbound total == stock cache delta, and the batch
    // stock total equals it too. Any drift here is silent inventory variance.
    const ledgerTotal = ledger.reduce((s, t) => s + Number(t.quantity), 0);
    const batchTotal = batches.reduce((s, b) => s + Number(b.currentStock), 0);
    const cacheDelta = Number(after!.stockQty) - stockBefore;
    expect(ledgerTotal).toBe(400);
    expect(batchTotal).toBe(ledgerTotal);
    expect(cacheDelta).toBe(ledgerTotal);
  }, 180_000);

  it('5. Replaying the same idempotency key returns the durable result without a second write', async () => {
    const rows = Array.from({ length: 500 }, (_, i) => ({
      code: `${codePrefix}-REPLAY-${String(i).padStart(4, '0')}`,
      name: `Replay Material ${i}`,
      type: 'RAW_MATERIAL',
      unit: 'KG',
      unitPrice: 500,
    }));
    const key = `${codePrefix}-replay`;

    const first = await importer.importData('material', rows, { actor, idempotencyKey: key });
    expect(first.importedRows).toBe(500);

    const second = await importer.importData('material', rows, { actor, idempotencyKey: key });
    expect(second).toEqual(first);

    const persisted = await harness.prisma.materialItem.count({
      where: { code: { startsWith: `${codePrefix}-REPLAY-` } },
    });
    expect(persisted).toBe(500);

    const executions = await harness.prisma.importExecution.count({ where: { idempotencyKey: key } });
    expect(executions).toBe(1);

    // A different payload under the same key must be refused, not merged.
    await expect(
      importer.importData(
        'material',
        [{ code: `${codePrefix}-REPLAY-CONFLICT`, name: 'Conflict', type: 'RAW_MATERIAL', unit: 'KG', unitPrice: 1 }],
        { actor, idempotencyKey: key }
      )
    ).rejects.toMatchObject({ response: expect.objectContaining({ message: expect.stringContaining('IDEMPOTENCY_CONFLICT') }) });
  }, 180_000);
});
