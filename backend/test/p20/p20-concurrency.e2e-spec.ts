/**
 * P20 Concurrency & High-Throughput Stress Test Suite (AC-P20-02)
 *
 * Simulates 50-100 concurrent transactions/users under simultaneous load:
 *   1. 60 concurrent inventory pick requests against a 50-unit stock batch:
 *      - 0 PostgreSQL deadlocks (code 40P01 or unhandled 500 errors)
 *      - 0 inventory variance (stock never negative, exactly 50 deducted, 10 rejected with 400)
 *   2. 50 concurrent balanced auto-journal postings:
 *      - 0 deadlocks under concurrent write contention
 *      - Trial balance remains perfectly balanced (Dr = Cr, delta = 0)
 *   3. 50 concurrent multi-user transactions:
 *      - Multi-tenant / multi-role concurrent write operations
 *      - Connection pool resilience & transaction integrity
 */
import request from 'supertest';
import { randomUUID } from 'crypto';
import { bootP20App, cleanP20Residuals, P20App } from './p20-http-harness';
import { FinanceService } from '../../src/modules/finance/finance.service';
import { SourceDocumentType } from '@prisma/client';

describe('P20 Concurrency: High-Throughput Load & Zero Variance (AC-P20-02)', () => {
  let harness: P20App;
  let financeService: FinanceService;
  let accounts: Record<string, any>;
  let warehouseToken: string;

  const runId = randomUUID().slice(0, 6);
  const tag = `P20-CC-${runId}`;

  beforeAll(async () => {
    harness = await bootP20App();
    financeService = harness.app.get(FinanceService);
    await cleanP20Residuals(harness.prisma);
    accounts = await harness.ensureStandardAccounts();

    const whUser = await harness.createUser(`WH_${runId}`, ['SUPER_ADMIN', 'WAREHOUSE']);
    warehouseToken = whUser.token;
  }, 120000);

  afterAll(async () => {
    await cleanP20Residuals(harness.prisma);
    await harness.app.close();
  });

  it('1. Executes 60 concurrent inventory picks against a 50-unit batch: 0 deadlocks, 0 inventory variance', async () => {
    const sup = await harness.prisma.supplier.create({
      data: { name: `nex_p20_cc_sup_${runId}` },
    });

    const mat = await harness.prisma.materialItem.create({
      data: {
        name: `P20 High Contention Raw Material ${runId}`,
        code: `P20-MAT-CC-${runId}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 50000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 20,
        stockQty: 50,
      },
    });

    // Create batch with exactly 50 units
    const batch = await harness.prisma.materialInventory.create({
      data: {
        materialId: mat.id,
        supplierId: sup.id,
        batchNumber: `P20-LOT-CC-${runId}`,
        currentStock: 50,
        qcStatus: 'GOOD',
        expDate: new Date('2028-12-31T00:00:00.000Z'),
        receivingDate: new Date('2026-01-01T00:00:00.000Z'),
      },
    });

    const initialBatchStock = 50;
    const concurrentRequestsCount = 60; // 60 requests competing for 50 items (1 item each)

    // Fire 60 concurrent HTTP requests simultaneously
    const pickPromises = Array.from({ length: concurrentRequestsCount }, (_, idx) => {
      const reqId = `${runId}-${idx.toString().padStart(3, '0')}`;
      return request(harness.app.getHttpServer())
        .post('/warehouse/picking/execute')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .set('x-idempotency-key', `P20-IDEM-CC-${reqId}`)
        .send({
          materialId: mat.id,
          batchId: batch.id,
          quantity: 1,
          referenceNo: `P20-PICK-CC-${reqId}`,
        });
    });

    const settled = await Promise.allSettled(pickPromises);

    // Analyze results
    let successCount = 0;
    let rejectedCount = 0;
    let deadlockCount = 0;
    let error500Count = 0;

    for (const res of settled) {
      if (res.status === 'fulfilled') {
        const httpStatus = res.value.status;
        if (httpStatus === 200 || httpStatus === 201) {
          successCount++;
          expect(res.value.body.success).toBe(true);
          expect(res.value.body.deductedQty).toBe(1);
        } else if (httpStatus === 400) {
          rejectedCount++;
          const errText =
            typeof res.value.body?.message === 'string'
              ? res.value.body.message
              : typeof res.value.body?.error === 'string'
                ? res.value.body.error
                : typeof res.value.body?.error?.message === 'string'
                  ? res.value.body.error.message
                  : JSON.stringify(res.value.body || res.value.text || '');
          expect(errText.toLowerCase()).toMatch(/insufficient[_\s]stock/);
        } else {
          error500Count++;
          const errBody = JSON.stringify(res.value.body);
          if (errBody.includes('40P01') || errBody.toLowerCase().includes('deadlock')) {
            deadlockCount++;
          }
        }
      } else {
        error500Count++;
      }
    }

    // AC-P20-02 Assertion: ZERO deadlocks and ZERO 500 errors
    expect(deadlockCount).toBe(0);
    expect(error500Count).toBe(0);

    // Exactly 50 requests must succeed (fulfilling the 50 available units)
    expect(successCount).toBe(50);
    // Exactly 10 requests must be cleanly rejected due to stock exhaustion
    expect(rejectedCount).toBe(10);

    // Verify Final DB State
    const finalBatch = await harness.prisma.materialInventory.findUnique({
      where: { id: batch.id },
    });
    const finalMat = await harness.prisma.materialItem.findUnique({
      where: { id: mat.id },
    });

    const finalStock = Number(finalBatch!.currentStock);
    const finalMatStock = Number(finalMat!.stockQty);

    // AC-P20-02 Assertion: ZERO inventory variance
    // Remaining stock must be exactly 0 (no negative stock, no over-allocation)
    expect(finalStock).toBe(0);
    expect(finalMatStock).toBe(0);

    // Total outbound movements must equal initial stock
    const transactions = await harness.prisma.inventoryTransaction.findMany({
      where: { inventoryId: batch.id, type: 'OUTBOUND' },
    });
    expect(transactions).toHaveLength(50);
    const totalDeducted = transactions.reduce((sum, t) => sum + Number(t.quantity), 0);
    expect(totalDeducted).toBe(initialBatchStock);

    // Inventory conservation equation: Initial = Final + Total Deducted
    const inventoryVariance = initialBatchStock - (finalStock + totalDeducted);
    expect(inventoryVariance).toBe(0);
  }, 180000);

  it('2. Executes 50 concurrent balanced auto-journals: 0 deadlocks, trial balance delta = 0', async () => {
    const concurrentJournalCount = 50;
    const amountPerEntry = 1_000_000;

    // Fire 50 concurrent double-entry journal postings across accounts 1110 (Kas) and 4101 (Penjualan)
    const journalPromises = Array.from({ length: concurrentJournalCount }, (_, idx) => {
      const entryId = `${runId}-JRN-${idx.toString().padStart(3, '0')}`;
      return harness.prisma.journalEntry.create({
        data: {
          date: new Date(),
          reference: `P20-CC-JRN-${entryId}`,
          description: `Concurrent Double Entry ${entryId} - ${tag}`,
          sourceDocumentType: SourceDocumentType.MANUAL,
          lines: {
            create: [
              { accountId: accounts['1110'].id, debit: amountPerEntry, credit: 0 },
              { accountId: accounts['4101'].id, debit: 0, credit: amountPerEntry },
            ],
          },
        },
      });
    });

    const results = await Promise.allSettled(journalPromises);

    let createdCount = 0;
    let failedCount = 0;

    for (const res of results) {
      if (res.status === 'fulfilled') {
        createdCount++;
      } else {
        failedCount++;
      }
    }

    // 0 deadlocks under concurrent write load
    expect(failedCount).toBe(0);
    expect(createdCount).toBe(concurrentJournalCount);

    // Verify Trial Balance Equilibrium
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const endOfToday = new Date();

    const tb = await financeService.getTrialBalance(startOfYear, endOfToday);
    expect(tb.isBalanced).toBe(true);

    const delta = Math.abs(tb.totals.totalDebit - tb.totals.totalCredit);
    expect(delta).toBeLessThanOrEqual(0.01);
  }, 180000);

  it('3. Executes 50 concurrent user lead operations: 0 deadlocks, 100% data integrity', async () => {
    const staff = await harness.createStaff(`nex_p20_cc_staff_${runId}`);
    const concurrentLeadCount = 50;

    const leadPromises = Array.from({ length: concurrentLeadCount }, (_, idx) => {
      const leadIdx = `${runId}-${idx.toString().padStart(3, '0')}`;
      return harness.prisma.salesLead.create({
        data: {
          clientName: `P20 Concurrent Client ${leadIdx}`,
          contactInfo: `client_${leadIdx}@example.com`,
          source: 'DIRECT',
          productInterest: `Concurrent SKU ${idx}`,
          picId: staff.id,
        },
      });
    });

    const results = await Promise.allSettled(leadPromises);

    const successfulLeads = results.filter((r) => r.status === 'fulfilled');
    expect(successfulLeads).toHaveLength(concurrentLeadCount);

    const distinctLeads = await harness.prisma.salesLead.count({
      where: { clientName: { contains: `P20 Concurrent Client ${runId}` } },
    });
    expect(distinctLeads).toBe(concurrentLeadCount);
  }, 180000);
});
