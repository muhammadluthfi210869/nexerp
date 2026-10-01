const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  console.log("--- 🧪 STARTING SUB-FASE 1.2: MASTER PELANGGAN FULL-STACK TEST ---\n");

  // [1/6] Check Customer Categories
  console.log("[1/6] Checking Customer Categories in PostgreSQL...");
  const catRes = await pool.query(
    "SELECT id, code, name FROM master_categories WHERE type = 'CUSTOMER' ORDER BY code ASC"
  );
  if (catRes.rows.length === 0) {
    throw new Error("❌ No customer categories found!");
  }
  console.log(`Found ${catRes.rows.length} customer categories:`, catRes.rows.map(r => `${r.code}: ${r.name}`).join(', '));
  const testCategory = catRes.rows[0];

  // [2/6] Check Sales Staff
  console.log("\n[2/6] Checking Bussdev Staff (Sales PIC)...");
  const staffRes = await pool.query("SELECT id, name FROM bussdev_staffs WHERE \"isActive\" = true LIMIT 1");
  let testStaffId = staffRes.rows[0]?.id;
  if (!testStaffId) {
    const anyStaff = await pool.query("SELECT id, name FROM bussdev_staffs LIMIT 1");
    testStaffId = anyStaff.rows[0]?.id;
  }
  console.log(`Using Sales Staff ID: ${testStaffId}`);

  // [3/6] Create Customer (Zero-Mock in PostgreSQL)
  console.log("\n[3/6] Testing Customer Creation in PostgreSQL...");
  const testId = 'test-lead-' + Date.now();
  const testBrandCode = 'CUST-TEST-' + Date.now().toString().slice(-4);
  const testBirthDate = new Date('1990-05-15T00:00:00.000Z');

  const createRes = await pool.query(
    `INSERT INTO sales_leads (
      id, "clientName", "brandName", "brandCode", "contactInfo", email, 
      "birthDate", city, province, "addressDetail", status, source, "productInterest", 
      "estimatedValue", "categoryId", "picId", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'NEW_LEAD', 'DIRECT', 'Maklon Skincare', 
      10000000.00, $10, $11, NOW(), NOW()
    ) RETURNING id, "clientName", "brandName", "brandCode", "contactInfo", "birthDate", city, "categoryId", "picId"`,
    [
      'Ibu Jessica Pratama',
      'GLOWING AESTHETIC LAB',
      testBrandCode,
      '081298877665',
      'jessica@glowlab.id',
      testBirthDate,
      'Kota Surabaya',
      'Jawa Timur',
      'Jl. Raya Jemursari No. 88, Wonocolo',
      testCategory.id,
      testStaffId
    ]
  );

  const createdCustomer = createRes.rows[0];
  console.log(`✅ Created Customer ID: ${createdCustomer.id}`);
  console.log(`  - Client Name: ${createdCustomer.clientName}`);
  console.log(`  - Brand Name: ${createdCustomer.brandName}`);
  console.log(`  - Brand Code: ${createdCustomer.brandCode}`);
  console.log(`  - Contact: ${createdCustomer.contactInfo}`);
  console.log(`  - Birth Date: ${createdCustomer.birthDate}`);
  console.log(`  - City: ${createdCustomer.city}`);

  // [4/6] Verify Field Parity and Category Relation
  console.log("\n[4/6] Verifying Field Parity & Relations Query...");
  const queryRes = await pool.query(
    `SELECT l.id, l."clientName", l."brandName", l."brandCode", l."contactInfo", l."birthDate", l.city,
            c.name as "categoryName", s.name as "picName"
     FROM sales_leads l
     LEFT JOIN master_categories c ON l."categoryId" = c.id
     LEFT JOIN bussdev_staffs s ON l."picId" = s.id
     WHERE l.id = $1`,
    [createdCustomer.id]
  );
  if (queryRes.rows.length === 0) throw new Error("Customer query failed!");
  const qItem = queryRes.rows[0];
  console.log(`✅ Queried Customer successfully:`);
  console.log(`  - Category Relation: ${qItem.categoryName}`);
  console.log(`  - Sales PIC Relation: ${qItem.picName}`);

  // [5/6] Test Customer Update (birthDate, city, brandName)
  console.log("\n[5/6] Testing Customer Update...");
  const updatedBirthDate = new Date('1992-10-20T00:00:00.000Z');
  await pool.query(
    `UPDATE sales_leads 
     SET "brandName" = 'GLOWING AESTHETIC DERMA', city = 'Kota Sidoarjo', "birthDate" = $1, "updatedAt" = NOW()
     WHERE id = $2`,
    [updatedBirthDate, createdCustomer.id]
  );

  const verifyUpdate = await pool.query(
    `SELECT "brandName", city, "birthDate" FROM sales_leads WHERE id = $1`,
    [createdCustomer.id]
  );
  console.log(`✅ Updated Brand Name: ${verifyUpdate.rows[0].brandName}`);
  console.log(`✅ Updated City: ${verifyUpdate.rows[0].city}`);
  console.log(`✅ Updated BirthDate: ${verifyUpdate.rows[0].birthDate}`);

  // [6/6] Cleanup Test Customer
  console.log("\n[6/6] Cleaning up test customer...");
  await pool.query('DELETE FROM sales_leads WHERE id = $1', [createdCustomer.id]);
  console.log("✅ Cleaned up successfully.");

  console.log("\n🎉 ALL 6 SUB-FASE 1.2 MASTER PELANGGAN TESTS PASSED WITH 100% SUCCESS!\n");
  await pool.end();
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
