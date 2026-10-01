const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  console.log("--- 🧪 STARTING SUB-FASE 1.6: TARGET PENJUALAN & KATEGORI PENJUALAN INTEGRATION TEST ---\n");

  let createdTargetId = null;
  let createdCategoryId = null;

  try {
    // [1/7] Verify Database Tables
    console.log("[1/7] Checking sales_targets & sales_categories tables in PostgreSQL...");
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('sales_targets', 'sales_categories', 'users')
    `);
    const tables = tableRes.rows.map(r => r.table_name);
    if (!tables.includes('sales_targets') || !tables.includes('sales_categories') || !tables.includes('users')) {
      throw new Error(`❌ Missing required tables! Found: ${tables.join(', ')}`);
    }
    console.log(`✅ Required tables verified: ${tables.join(', ')}`);

    // [2/7] Pick a valid user for sales target assignment
    console.log("\n[2/7] Selecting user for target assignment...");
    const userRes = await pool.query(`SELECT id, "fullName", email, roles FROM users LIMIT 1`);
    if (userRes.rows.length === 0) {
      throw new Error("❌ No users found in database!");
    }
    const testUser = userRes.rows[0];
    console.log(`✅ Selected User: ${testUser.fullName || testUser.email} (ID=${testUser.id})`);

    // Clean up any test target from prior runs for month 11 / 2026
    await pool.query(
      `DELETE FROM sales_targets WHERE "userId" = $1 AND month = 11 AND year = 2026`,
      [testUser.id]
    );

    // [3/7] Create Sales Target in PostgreSQL
    console.log("\n[3/7] Creating Sales Target in PostgreSQL...");
    const testMonth = 11;
    const testYear = 2026;
    const testNominal = 750000000;
    const testNotes = "Target Uji Sub-Fase 1.6 Maklon Kosmetik Q4";

    const insertTargetRes = await pool.query(
      `INSERT INTO sales_targets (
        id, "userId", month, year, "nominalTarget", notes, "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()
      ) RETURNING id, "userId", month, year, "nominalTarget", notes`,
      [testUser.id, testMonth, testYear, testNominal, testNotes]
    );

    createdTargetId = insertTargetRes.rows[0].id;
    console.log(`✅ Sales Target created successfully: ID=${createdTargetId}`);
    console.log(`   - Month: ${insertTargetRes.rows[0].month}`);
    console.log(`   - Year: ${insertTargetRes.rows[0].year}`);
    console.log(`   - Nominal: Rp ${Number(insertTargetRes.rows[0].nominalTarget).toLocaleString('id-ID')}`);
    console.log(`   - Notes: "${insertTargetRes.rows[0].notes}"`);

    // [4/7] Query Sales Target with User Join
    console.log("\n[4/7] Querying Sales Target with user join relation...");
    const joinRes = await pool.query(
      `SELECT t.id, t.month, t.year, t."nominalTarget", t.notes,
              u."fullName", u.email, u.roles
       FROM sales_targets t
       JOIN users u ON t."userId" = u.id
       WHERE t.id = $1`,
      [createdTargetId]
    );

    if (joinRes.rows.length === 0) {
      throw new Error("❌ Failed to query created sales target with user join!");
    }
    const joined = joinRes.rows[0];
    console.log(`✅ Verified joined target: Marketing="${joined.fullName || joined.email}" | Nominal=Rp ${Number(joined.nominalTarget).toLocaleString('id-ID')}`);

    // [5/7] Update Sales Target
    console.log("\n[5/7] Updating Sales Target nominal...");
    const updatedNominal = 850000000;
    const updatedNotes = "Target Uji Sub-Fase 1.6 (Revisi Target Ditambah 100 Jt)";

    await pool.query(
      `UPDATE sales_targets 
       SET "nominalTarget" = $1, notes = $2, "updatedAt" = NOW() 
       WHERE id = $3`,
      [updatedNominal, updatedNotes, createdTargetId]
    );

    const verifyUpdate = await pool.query(
      `SELECT "nominalTarget", notes FROM sales_targets WHERE id = $1`,
      [createdTargetId]
    );
    if (Number(verifyUpdate.rows[0].nominalTarget) !== updatedNominal) {
      throw new Error("❌ Update verification failed!");
    }
    console.log(`✅ Sales Target updated: Nominal=Rp ${Number(verifyUpdate.rows[0].nominalTarget).toLocaleString('id-ID')} | Notes="${verifyUpdate.rows[0].notes}"`);

    // [6/7] Test Sales Categories (Kategori Penjualan)
    console.log("\n[6/7] Verifying Sales Categories (Kategori Penjualan)...");
    const categoriesCount = await pool.query(`SELECT count(*)::int as cnt FROM sales_categories`);
    console.log(`   Existing sales categories count: ${categoriesCount.rows[0].cnt}`);

    // Create custom category
    const testCatName = `Uji Kategori Penjualan ${Date.now()}`;
    const testCatDesc = "Kategori uji proyek maklon kosmetik subfase 1.6";

    const insertCatRes = await pool.query(
      `INSERT INTO sales_categories (id, name, description, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
       RETURNING id, name, description`,
      [testCatName, testCatDesc]
    );

    createdCategoryId = insertCatRes.rows[0].id;
    console.log(`✅ Custom Sales Category created: ID=${createdCategoryId}, Name="${testCatName}"`);

    // Update category
    const updatedCatDesc = "Kategori uji proyek maklon kosmetik (Deskripsi Diperbarui)";
    await pool.query(
      `UPDATE sales_categories SET description = $1, "updatedAt" = NOW() WHERE id = $2`,
      [updatedCatDesc, createdCategoryId]
    );

    const verifyCat = await pool.query(`SELECT description FROM sales_categories WHERE id = $1`, [createdCategoryId]);
    if (verifyCat.rows[0].description !== updatedCatDesc) {
      throw new Error("❌ Category update verification failed!");
    }
    console.log(`✅ Sales Category update verified: "${verifyCat.rows[0].description}"`);

    // [7/7] Clean up
    console.log("\n[7/7] Cleaning up test data...");
    await pool.query(`DELETE FROM sales_targets WHERE id = $1`, [createdTargetId]);
    await pool.query(`DELETE FROM sales_categories WHERE id = $1`, [createdCategoryId]);
    console.log("✅ Cleanup complete.");

    console.log("\n🎉 ALL 7/7 TESTS FOR SUB-FASE 1.6 (TARGET PENJUALAN & KATEGORI PENJUALAN) PASSED SUCCESSFULLY! 🎉\n");

  } catch (err) {
    console.error("\n❌ SUB-FASE 1.6 TEST FAILED:", err);
    if (createdTargetId) {
      await pool.query(`DELETE FROM sales_targets WHERE id = $1`, [createdTargetId]).catch(() => {});
    }
    if (createdCategoryId) {
      await pool.query(`DELETE FROM sales_categories WHERE id = $1`, [createdCategoryId]).catch(() => {});
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
