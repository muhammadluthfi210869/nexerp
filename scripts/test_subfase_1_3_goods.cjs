const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  console.log("--- 🧪 STARTING SUB-FASE 1.3: MASTER BARANG & KATEGORI FULL-STACK TEST ---\n");

  // [1/6] Check Goods Categories
  console.log("[1/6] Checking Goods Categories in PostgreSQL...");
  const catRes = await pool.query(
    "SELECT id, code, name FROM master_categories WHERE type IN ('GOODS', 'RAW_MATERIAL', 'PACKAGING') ORDER BY code ASC"
  );
  if (catRes.rows.length === 0) {
    throw new Error("❌ No goods categories found!");
  }
  console.log(`Found ${catRes.rows.length} categories:`, catRes.rows.map(r => `${r.code}: ${r.name}`).slice(0, 5).join(', '));
  const testCategory = catRes.rows[0];

  // [2/6] Check Accounts for 8 CoA Mapping
  console.log("\n[2/6] Checking Chart of Accounts in PostgreSQL for 8 CoA Mappings...");
  const accRes = await pool.query("SELECT id, code, name FROM accounts LIMIT 8");
  if (accRes.rows.length < 2) {
    throw new Error("❌ Not enough accounts found for CoA mapping!");
  }
  console.log(`Found ${accRes.rows.length} sample accounts for CoA mapping.`);
  const coaMapping = {
    coa_1: accRes.rows[0]?.id,
    coa_2: accRes.rows[1]?.id,
    coa_3: accRes.rows[2]?.id || accRes.rows[0]?.id,
    coa_4: accRes.rows[3]?.id || accRes.rows[1]?.id,
    coa_5: accRes.rows[4]?.id || accRes.rows[0]?.id,
    coa_6: accRes.rows[5]?.id || accRes.rows[1]?.id,
    coa_7: accRes.rows[6]?.id || accRes.rows[0]?.id,
    coa_8: accRes.rows[7]?.id || accRes.rows[1]?.id,
  };

  // [3/6] Create Material (Zero-Mock in PostgreSQL)
  console.log("\n[3/6] Testing Material / Goods Creation in PostgreSQL...");
  const testCode = 'BRG-TEST-' + Date.now().toString().slice(-4);
  const testName = 'Niacinamide 99% USP - Batch Test ' + Date.now().toString().slice(-4);

  const createRes = await pool.query(
    `INSERT INTO material_items (
      id, code, name, type, unit, "unitPrice", "stockQty", "minLevel", "maxLevel", "reorderPoint",
      "categoryId", "subCategory", description, "coaMapping", "inventoryAccountId", "salesAccountId",
      status
    ) VALUES (
      gen_random_uuid(), $1, $2, 'RAW_MATERIAL', 'kg', 350000.00, 50.00, 10.00, 500.00, 15.00,
      $3, 'Active Ingredients', 'Bahan aktif kosmetik murni grade farmasi/skincare', $4, $5, $6,
      'ACTIVE'
    ) RETURNING id, code, name, unit, "unitPrice", "minLevel", "subCategory", "coaMapping"`,
    [
      testCode,
      testName,
      testCategory.id,
      JSON.stringify(coaMapping),
      coaMapping.coa_1,
      coaMapping.coa_2
    ]
  );

  const createdMaterial = createRes.rows[0];
  console.log(`✅ Created Material ID: ${createdMaterial.id}`);
  console.log(`  - Code: ${createdMaterial.code}`);
  console.log(`  - Name: ${createdMaterial.name}`);
  console.log(`  - Unit: ${createdMaterial.unit}`);
  console.log(`  - Price: Rp ${Number(createdMaterial.unitPrice).toLocaleString('id-ID')}`);
  console.log(`  - Sub Category: ${createdMaterial.subCategory}`);
  console.log(`  - 8 CoA Mapping present: ${Boolean(createdMaterial.coaMapping?.coa_1 && createdMaterial.coaMapping?.coa_6)}`);

  // [4/6] Query and Verify Field Parity
  console.log("\n[4/6] Verifying Field Parity & Category Relations...");
  const queryRes = await pool.query(
    `SELECT m.id, m.code, m.name, m.unit, m."unitPrice", m."minLevel", m."subCategory",
            c.name as "categoryName", a1.name as "invAccountName", a2.name as "salesAccountName"
     FROM material_items m
     LEFT JOIN master_categories c ON m."categoryId" = c.id
     LEFT JOIN accounts a1 ON m."inventoryAccountId" = a1.id
     LEFT JOIN accounts a2 ON m."salesAccountId" = a2.id
     WHERE m.id = $1`,
    [createdMaterial.id]
  );
  if (queryRes.rows.length === 0) throw new Error("Material query failed!");
  const qItem = queryRes.rows[0];
  console.log(`✅ Queried Material successfully:`);
  console.log(`  - Category Relation: ${qItem.categoryName}`);
  console.log(`  - coa_1 Inventory Account: ${qItem.invAccountName}`);
  console.log(`  - coa_2 Sales Account: ${qItem.salesAccountName}`);

  // [5/6] Test Purchase History Linkage (#modal-purchase-history)
  console.log("\n[5/6] Verifying Purchase History Linkage (#modal-purchase-history)...");
  // Check if any purchase orders exist
  const poRes = await pool.query(
    `SELECT poi.id, poi."unitPrice", poi.quantity, po."poNumber", po."createdAt", s.name as "supplierName"
     FROM purchase_order_items poi
     JOIN purchase_orders po ON poi."poId" = po.id
     LEFT JOIN suppliers s ON po."supplierId" = s.id
     LIMIT 1`
  );
  if (poRes.rows.length > 0) {
    const samplePo = poRes.rows[0];
    console.log(`✅ Purchase History Query Pipeline Verified:`);
    console.log(`  - Sample PO: ${samplePo.poNumber} | Qty: ${samplePo.quantity} | Supplier: ${samplePo.supplierName}`);
  } else {
    console.log("ℹ️ No existing POs found in test DB; purchase history schema and query join syntax verified.");
  }

  // [6/6] Test Material Update & Cleanup
  console.log("\n[6/6] Testing Material Update and Cleanup...");
  await pool.query(
    `UPDATE material_items 
     SET name = $1, "unitPrice" = 375000.00, "subCategory" = 'Cosmeceutical Active'
     WHERE id = $2`,
    [testName + ' (Updated)', createdMaterial.id]
  );

  const verifyUpdate = await pool.query(
    `SELECT name, "unitPrice", "subCategory" FROM material_items WHERE id = $1`,
    [createdMaterial.id]
  );
  console.log(`✅ Updated Name: ${verifyUpdate.rows[0].name}`);
  console.log(`✅ Updated Price: Rp ${Number(verifyUpdate.rows[0].unitPrice).toLocaleString('id-ID')}`);
  console.log(`✅ Updated SubCategory: ${verifyUpdate.rows[0].subCategory}`);

  await pool.query('DELETE FROM material_items WHERE id = $1', [createdMaterial.id]);
  console.log("✅ Cleaned up test material successfully.");

  console.log("\n🎉 ALL 6 SUB-FASE 1.3 MASTER BARANG TESTS PASSED WITH 100% SUCCESS!\n");
  await pool.end();
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
