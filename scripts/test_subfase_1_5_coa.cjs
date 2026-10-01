const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  console.log("--- 🧪 STARTING SUB-FASE 1.5: MASTER COA & COA JURNAL OTOMATIS INTEGRATION TEST ---\n");

  let headerAccountId = null;
  let childAccountId = null;
  const testCustomType = 'UJI_FAKTUR_CUSTOM_1_5';

  try {
    // [1/7] Check Database Tables
    console.log("[1/7] Checking accounts & auto_journal_configs tables in PostgreSQL...");
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('accounts', 'auto_journal_configs')
    `);
    const tables = tableRes.rows.map(r => r.table_name);
    if (!tables.includes('accounts') || !tables.includes('auto_journal_configs')) {
      throw new Error(`❌ Missing required tables! Found: ${tables.join(', ')}`);
    }
    console.log(`✅ Required tables verified: ${tables.join(', ')}`);

    // [2/7] Create Parent Header Account
    console.log("\n[2/7] Creating Header Account (allowManualJournal: false)...");
    const headerCode = '99000';
    const headerName = 'UJI INDUK BIAYA OPERASIONAL 1.5';
    
    // Clean up if previous run left test data
    await pool.query(`DELETE FROM auto_journal_configs WHERE "transactionType" = $1`, [testCustomType]);
    await pool.query(`DELETE FROM accounts WHERE code IN ('99000', '99100')`);

    const insertHeaderRes = await pool.query(
      `INSERT INTO accounts (
        id, code, name, type, "normalBalance", "allowManualJournal", "isActive"
      ) VALUES (
        gen_random_uuid(), $1, $2, 'EXPENSE', 'DEBIT', false, true
      ) RETURNING id, code, name, "allowManualJournal", "parentId"`,
      [headerCode, headerName]
    );

    headerAccountId = insertHeaderRes.rows[0].id;
    console.log(`✅ Header Account created: ID=${headerAccountId}, Code=${headerCode}, allowManualJournal=${insertHeaderRes.rows[0].allowManualJournal}`);

    if (insertHeaderRes.rows[0].allowManualJournal !== false) {
      throw new Error("❌ Header account should have allowManualJournal = false!");
    }

    // [3/7] Create Child Detail Account with Parent Relationship
    console.log("\n[3/7] Creating Child Detail Account with parent relation...");
    const childCode = '99100';
    const childName = 'UJI SUB-BIAYA TRANSPORTASI 1.5';

    const insertChildRes = await pool.query(
      `INSERT INTO accounts (
        id, code, name, type, "normalBalance", "allowManualJournal", "parentId", "isActive"
      ) VALUES (
        gen_random_uuid(), $1, $2, 'EXPENSE', 'DEBIT', true, $3, true
      ) RETURNING id, code, name, "allowManualJournal", "parentId"`,
      [childCode, childName, headerAccountId]
    );

    childAccountId = insertChildRes.rows[0].id;
    console.log(`✅ Child Account created: ID=${childAccountId}, Code=${childCode}, ParentID=${insertChildRes.rows[0].parentId}`);

    if (insertChildRes.rows[0].parentId !== headerAccountId) {
      throw new Error(`❌ Child account parentId does not match headerAccountId! Expected ${headerAccountId}, got ${insertChildRes.rows[0].parentId}`);
    }

    // [4/7] Query Account with Parent Joined (Hierarchical Tree)
    console.log("\n[4/7] Verifying hierarchical parent join query in PostgreSQL...");
    const joinRes = await pool.query(
      `SELECT c.id, c.code, c.name, p.code as "parentCode", p.name as "parentName"
       FROM accounts c
       LEFT JOIN accounts p ON c."parentId" = p.id
       WHERE c.id = $1`,
      [childAccountId]
    );

    const joined = joinRes.rows[0];
    console.log(`✅ Hierarchical Query success: Child [${joined.code}] "${joined.name}" -> Parent [${joined.parentCode}] "${joined.parentName}"`);

    // [5/7] Update Child Account
    console.log("\n[5/7] Updating Child Account fields...");
    const updatedName = 'UJI SUB-BIAYA TRANSPORTASI UPDATED 1.5';
    await pool.query(
      `UPDATE accounts SET name = $1 WHERE id = $2`,
      [updatedName, childAccountId]
    );

    const verifyUpdate = await pool.query(`SELECT name FROM accounts WHERE id = $1`, [childAccountId]);
    if (verifyUpdate.rows[0].name !== updatedName) {
      throw new Error("❌ Update verification failed!");
    }
    console.log(`✅ Child Account updated successfully: "${verifyUpdate.rows[0].name}"`);

    // [6/7] Auto Journal Configurations — Seed and Custom Rule Mapping
    console.log("\n[6/7] Testing Auto Journal Configs (Double-Entry Posting Rules)...");
    
    // Check if standard rules exist or insert default set
    const standardRules = [
      'FAKTUR_PEMBELIAN_HUTANG',
      'FAKTUR_PEMBELIAN_DISKON',
      'FAKTUR_PEMBELIAN_BIAYA_LAIN',
      'FAKTUR_PEMBELIAN_PPN_MASUKAN',
      'STOK_OPNAME_KOREKSI',
      'PENGIRIMAN_BARANG_TRANSIT',
      'FAKTUR_PENJUALAN_PIUTANG',
      'PENJUALAN_POTONGAN',
      'PENJUALAN_PPN_KELUARAN',
      'UANG_MUKA_PEMBELIAN',
      'UANG_MUKA_PENJUALAN',
      'RETUR_PEMBELIAN_SELISIH',
    ];

    // Pick two existing accounts for seeding test
    const anyTwoAccounts = await pool.query(`SELECT id FROM accounts LIMIT 2`);
    if (anyTwoAccounts.rows.length < 2) {
      throw new Error("❌ Need at least 2 accounts in DB to verify auto-journal configs!");
    }
    const acc1 = anyTwoAccounts.rows[0].id;
    const acc2 = anyTwoAccounts.rows[1].id;

    for (const ruleType of standardRules) {
      await pool.query(
        `INSERT INTO auto_journal_configs (
          "transactionType", "coaDebetId", "coaCreditId", description, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT ("transactionType") DO UPDATE SET "updatedAt" = NOW()`,
        [ruleType, acc1, acc2, `Aturan standar untuk ${ruleType}`]
      );
    }

    const checkConfigs = await pool.query(
      `SELECT "transactionType", "coaDebetId", "coaCreditId" 
       FROM auto_journal_configs 
       WHERE "transactionType" = ANY($1)`,
      [standardRules]
    );

    console.log(`✅ Standard 12 G-SERP Auto Journal Rules verified in PostgreSQL: count=${checkConfigs.rows.length}/12`);
    if (checkConfigs.rows.length !== 12) {
      throw new Error(`❌ Expected 12 standard rules, found ${checkConfigs.rows.length}`);
    }

    // Now test custom rule upsert using our created test accounts
    console.log("\n   Creating custom auto-journal config with test accounts...");
    await pool.query(
      `INSERT INTO auto_journal_configs (
        "transactionType", "coaDebetId", "coaCreditId", description, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, 'Aturan Uji Posting Otomatis 1.5', NOW(), NOW())
      ON CONFLICT ("transactionType") DO UPDATE SET 
        "coaDebetId" = EXCLUDED."coaDebetId",
        "coaCreditId" = EXCLUDED."coaCreditId",
        description = EXCLUDED.description,
        "updatedAt" = NOW()`,
      [testCustomType, childAccountId, headerAccountId]
    );

    const verifyCustomRule = await pool.query(
      `SELECT cfg."transactionType", cfg.description, 
              d.code as "debitCode", d.name as "debitName",
              c.code as "creditCode", c.name as "creditName"
       FROM auto_journal_configs cfg
       JOIN accounts d ON cfg."coaDebetId" = d.id
       JOIN accounts c ON cfg."coaCreditId" = c.id
       WHERE cfg."transactionType" = $1`,
      [testCustomType]
    );

    if (verifyCustomRule.rows.length === 0) {
      throw new Error("❌ Custom auto-journal config was not saved or joined properly!");
    }
    const cr = verifyCustomRule.rows[0];
    console.log(`✅ Custom Auto Rule Verified: ${cr.transactionType} -> Dr: [${cr.debitCode}] ${cr.debitName} | Cr: [${cr.creditCode}] ${cr.creditName}`);

    // [7/7] Clean up
    console.log("\n[7/7] Cleaning up test data...");
    await pool.query(`DELETE FROM auto_journal_configs WHERE "transactionType" = $1`, [testCustomType]);
    await pool.query(`DELETE FROM accounts WHERE id = $1`, [childAccountId]);
    await pool.query(`DELETE FROM accounts WHERE id = $1`, [headerAccountId]);

    console.log("✅ Cleanup complete.");
    console.log("\n🎉 ALL 7/7 TESTS FOR SUB-FASE 1.5 (MASTER COA & COA JURNAL OTOMATIS) PASSED SUCCESSFULLY! 🎉\n");

  } catch (err) {
    console.error("\n❌ SUB-FASE 1.5 TEST FAILED:", err);
    // Cleanup if possible
    if (testCustomType) {
      await pool.query(`DELETE FROM auto_journal_configs WHERE "transactionType" = $1`, [testCustomType]).catch(() => {});
    }
    if (childAccountId) {
      await pool.query(`DELETE FROM accounts WHERE id = $1`, [childAccountId]).catch(() => {});
    }
    if (headerAccountId) {
      await pool.query(`DELETE FROM accounts WHERE id = $1`, [headerAccountId]).catch(() => {});
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
