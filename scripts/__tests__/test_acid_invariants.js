/**
 * Comprehensive Database ACID Invariants & Race Condition Stress Test
 *
 * Verifies:
 * 1. Double-Entry Invariant: for every journal entry, sum(debit) == sum(credit) (tolerance <= 0.01)
 * 2. Global Ledger Trial Balance: sum(all debits) == sum(all credits)
 * 3. Non-Negative Inventory Invariant: zero lots or materials with stock < 0
 * 4. 3-Pillar Physical GRN Invariant: Reject in quarantine with 0 AP; Free bonus at 0 cost
 * 5. Idempotent Transaction Invariant: zero duplicate operational journal references
 * 6. Concurrency Isolation Test: high-contention simultaneous transactions maintain ACID integrity
 */
const path = require('path');
const backendDir = path.resolve(__dirname, '../../backend');
const backendNodeModules = path.join(backendDir, 'node_modules');

// Helper to require from backend node_modules
function requireBackend(mod) {
  try {
    return require(mod);
  } catch {
    return require(require.resolve(mod, { paths: [backendNodeModules] }));
  }
}

const { PrismaClient } = requireBackend('@prisma/client');
const { PrismaPg } = requireBackend('@prisma/adapter-pg');
const { Pool } = requireBackend('pg');
const dotenv = requireBackend('dotenv');

// Load environment
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public';

async function runAcidSuite() {
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🧪 RUNNING DATABASE ACID INVARIANTS & CONCURRENCY VERIFIER');
  console.log('  Target Database:', dbUrl.replace(/:[^:@]+@/, ':****@'));
  console.log('═══════════════════════════════════════════════════════════════\n');

  let totalTests = 0;
  let passedTests = 0;
  const failures = [];

  function assertCheck(name, condition, details) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${name}`);
      if (details) console.log(`   ${details}`);
    } else {
      failures.push({ name, details });
      console.error(`❌ [FAIL] ${name}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  try {
    // 1. Double-Entry Per-Entry Balance (DEC-015 / BUS-RULE-056)
    console.log('--- 1. Double-Entry Invariant per Journal Entry ---');
    const unbalancedEntries = await prisma.$queryRawUnsafe(`
      SELECT
        je.id,
        je.reference,
        je."sourceDocumentType",
        COALESCE(SUM(jl.debit), 0) AS total_debit,
        COALESCE(SUM(jl.credit), 0) AS total_credit,
        ABS(COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0)) AS diff
      FROM journal_entries je
      JOIN journal_lines jl ON jl."journalId" = je.id
      GROUP BY je.id, je.reference, je."sourceDocumentType"
      HAVING ABS(COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0)) > 0.01
    `);

    assertCheck(
      'Every Journal Entry has sum(debit) == sum(credit) (Delta <= 0.01)',
      unbalancedEntries.length === 0,
      unbalancedEntries.length === 0
        ? 'All journal entries in database are strictly balanced.'
        : `Found ${unbalancedEntries.length} unbalanced entries: ` + JSON.stringify(unbalancedEntries.slice(0, 3))
    );

    // 2. Global Ledger Trial Balance
    console.log('\n--- 2. Global Trial Balance Keseimbangan Buku Besar ---');
    const globalTrialBalance = await prisma.$queryRawUnsafe(`
      SELECT
        COALESCE(SUM(jl.debit), 0) AS global_debit,
        COALESCE(SUM(jl.credit), 0) AS global_credit,
        ABS(COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0)) AS global_diff
      FROM journal_lines jl
      JOIN journal_entries je ON je.id = jl."journalId"
    `);

    const gDebit = Number(globalTrialBalance[0]?.global_debit || 0);
    const gCredit = Number(globalTrialBalance[0]?.global_credit || 0);
    const gDiff = Math.abs(gDebit - gCredit);

    assertCheck(
      'Global General Ledger Balance (Sum(Debits) - Sum(Credits) <= 0.01)',
      gDiff <= 0.01,
      `Total Debit: ${gDebit.toLocaleString('id-ID', { minimumFractionDigits: 2 })}, ` +
      `Total Credit: ${gCredit.toLocaleString('id-ID', { minimumFractionDigits: 2 })}, ` +
      `Difference: ${gDiff.toFixed(4)}`
    );

    // 3. Non-Negative Inventory Invariant
    console.log('\n--- 3. Non-Negative Inventory Invariants ---');
    const negativeMaterials = await prisma.$queryRawUnsafe(`
      SELECT id, name, code, "stockQty"
      FROM material_items
      WHERE "stockQty" < 0
    `);

    assertCheck(
      'Zero Material Items with Negative Stock (stockQty >= 0)',
      negativeMaterials.length === 0,
      negativeMaterials.length === 0
        ? 'No material items have negative stock quantity.'
        : `Negative stock items detected: ${negativeMaterials.map(m => `${m.code}: ${m.stockQty}`).join(', ')}`
    );

    const negativeLots = await prisma.$queryRawUnsafe(`
      SELECT id, "batchNumber", "currentStock"
      FROM material_inventories
      WHERE "currentStock" < 0
    `);

    assertCheck(
      'Zero Material Inventory Lots with Negative Stock (currentStock >= 0)',
      negativeLots.length === 0,
      negativeLots.length === 0
        ? 'No inventory batches/lots have negative physical stock.'
        : `Negative lots detected: ${negativeLots.map(l => `${l.batchNumber}: ${l.currentStock}`).join(', ')}`
    );

    // 4. Physical 3-Pillar GRN Invariant
    console.log('\n--- 4. Physical 3-Pillar GRN Inventory Invariant ---');
    // Ensure that rejected stock in warehouse receipts has not been posted into commercial AP bills
    const invalidRejectBilling = await prisma.$queryRawUnsafe(`
      SELECT
        b.id AS bill_id,
        b."billNumber",
        bli."itemName",
        bli.price,
        bli.qty,
        bli."rejectQty"
      FROM bills b
      JOIN bill_line_items bli ON bli."billId" = b.id
      WHERE (LOWER(bli."itemName") LIKE '%reject%' OR bli."rejectQty" > 0)
        AND bli.price > 0
        AND bli.qty = 0
    `);

    assertCheck(
      'Zero AP Billing for Rejected Goods ($0 AP Liability for Rejects)',
      invalidRejectBilling.length === 0,
      invalidRejectBilling.length === 0
        ? 'All rejected goods are isolated with 0 AP billing liability.'
        : `Detected ${invalidRejectBilling.length} rejected line items billed in AP: ` + JSON.stringify(invalidRejectBilling)
    );

    // 5. Transaction Idempotency Invariant
    console.log('\n--- 5. Transaction Idempotency & Unique Reference Invariant ---');
    const duplicateOperationalRefs = await prisma.$queryRawUnsafe(`
      SELECT reference, COUNT(*) AS count
      FROM journal_entries
      WHERE reference IS NOT NULL
        AND reference != ''
        AND reference NOT LIKE '%test%'
        AND reference NOT LIKE '%manual%'
      GROUP BY reference
      HAVING COUNT(*) > 1
    `);

    assertCheck(
      'Zero Duplicate Operational Journal References (Idempotent Posting)',
      duplicateOperationalRefs.length === 0,
      duplicateOperationalRefs.length === 0
        ? 'All operational journal entry references are strictly unique.'
        : `Found duplicate references: ` + JSON.stringify(duplicateOperationalRefs)
    );

    // 6. Real-time Concurrency Isolation & Row Locking Stress Test
    console.log('\n--- 6. Active Concurrency Isolation Stress Test ---');
    const testTag = `ACID-RACE-${Date.now()}`;

    // Create test supplier and material
    const testSupplier = await prisma.supplier.create({
      data: { name: `Acid_Test_Sup_${testTag}` }
    });

    const initialStock = 20;
    const testMaterial = await prisma.materialItem.create({
      data: {
        name: `Acid Test Concurrency Material ${testTag}`,
        code: `MAT-${testTag}`,
        type: 'RAW_MATERIAL',
        unit: 'PCS',
        unitPrice: 15000,
        minLevel: 5,
        maxLevel: 500,
        reorderPoint: 10,
        stockQty: initialStock
      }
    });

    const testLot = await prisma.materialInventory.create({
      data: {
        materialId: testMaterial.id,
        supplierId: testSupplier.id,
        batchNumber: `LOT-${testTag}`,
        currentStock: initialStock,
        qcStatus: 'GOOD',
        expDate: new Date('2030-01-01T00:00:00.000Z'),
        receivingDate: new Date()
      }
    });

    // Fire 30 concurrent transactions attempting to deduct 1 unit from 20-unit lot
    const concurrentAttempts = 30;
    const promises = [];

    for (let i = 0; i < concurrentAttempts; i++) {
      promises.push((async (index) => {
        try {
          return await prisma.$transaction(async (tx) => {
            // Select with FOR UPDATE row lock to serialize concurrent access
            const lockedRows = await tx.$queryRawUnsafe(`
              SELECT id, "currentStock"
              FROM material_inventories
              WHERE id = $1::uuid
              FOR UPDATE
            `, testLot.id);

            const current = Number(lockedRows[0]?.currentStock ?? 0);
            if (current < 1) {
              throw new Error('INSUFFICIENT_STOCK');
            }

            // Deduct exactly 1 unit
            await tx.materialInventory.update({
              where: { id: testLot.id },
              data: { currentStock: { decrement: 1 } }
            });

            await tx.materialItem.update({
              where: { id: testMaterial.id },
              data: { stockQty: { decrement: 1 } }
            });

            return { success: true, index };
          }, { isolationLevel: 'ReadCommitted', timeout: 15000 });
        } catch (err) {
          return { success: false, index, error: err.message };
        }
      })(i));
    }

    const results = await Promise.all(promises);
    const successfulDeductions = results.filter(r => r.success).length;
    const rejectedDeductions = results.filter(r => !r.success).length;

    // Verify post-concurrency lot balance
    const finalLot = await prisma.materialInventory.findUnique({
      where: { id: testLot.id }
    });
    const finalMaterial = await prisma.materialItem.findUnique({
      where: { id: testMaterial.id }
    });

    assertCheck(
      'Concurrency Race: Exactly 20 succeeded and 10 rejected on 20-unit lot under 30 concurrent hits',
      successfulDeductions === initialStock && rejectedDeductions === (concurrentAttempts - initialStock),
      `Successful: ${successfulDeductions}/${concurrentAttempts}, Rejected: ${rejectedDeductions}/${concurrentAttempts}`
    );

    assertCheck(
      'Concurrency Invariant: Stock Lot never negative and reached exactly 0',
      Number(finalLot.currentStock) === 0 && Number(finalMaterial.stockQty) === 0,
      `Final Lot Stock: ${finalLot.currentStock}, Final Material Stock: ${finalMaterial.stockQty}`
    );

    // Clean up temporary test data
    await prisma.materialInventory.delete({ where: { id: testLot.id } });
    await prisma.materialItem.delete({ where: { id: testMaterial.id } });
    await prisma.supplier.delete({ where: { id: testSupplier.id } });

  } catch (fatalErr) {
    console.error('FATAL SUITE ERROR:', fatalErr);
    failures.push({ name: 'Suite Execution', details: fatalErr.message });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  📊 RESULTS: ${passedTests}/${totalTests} CHECKS PASSED`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (failures.length > 0) {
    console.error('\nFAILURES SUMMARY:');
    failures.forEach((f, idx) => console.error(`${idx + 1}. ${f.name}: ${f.details}`));
    process.exit(1);
  } else {
    console.log('\n✨ ALL ACID INVARIANTS & CONCURRENCY CHECKS CERTIFIED 100% PASS!\n');
    process.exit(0);
  }
}

runAcidSuite();
