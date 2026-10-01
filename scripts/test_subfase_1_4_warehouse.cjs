const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  console.log("--- 🧪 STARTING SUB-FASE 1.4: MASTER GUDANG & HAK AKSES GUDANG INTEGRATION TEST ---\n");

  let createdWarehouseId = null;
  let testUserId = null;

  try {
    // [1/6] Check Database Tables
    console.log("[1/6] Checking warehouses & warehouse_access tables in PostgreSQL...");
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('warehouses', 'warehouse_access', 'users')
    `);
    const tables = tableRes.rows.map(r => r.table_name);
    if (!tables.includes('warehouses') || !tables.includes('warehouse_access') || !tables.includes('users')) {
      throw new Error(`❌ Missing required tables! Found: ${tables.join(', ')}`);
    }
    console.log(`✅ Required tables verified: ${tables.join(', ')}`);

    // [2/6] Create Warehouse with G-SERP Parity Fields
    console.log("\n[2/6] Creating warehouse with G-SERP fields (name, phone, province, city, address)...");
    const testWhName = `Gudang Transit Test ${Date.now()}`;
    const testPhone = '081234567890';
    const testProvince = 'Jawa Timur';
    const testCity = 'Kab. Sidoarjo';
    const testAddress = 'Kawasan Industri Rungkut Blok B-12';
    const testPic = 'Ghufron Supervisor';

    const insertWhRes = await pool.query(
      `INSERT INTO warehouses (
        id, name, phone, province, city, address, "picName", status, "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'ACTIVE', NOW(), NOW()
      ) RETURNING id, name, phone, province, city, address, "picName", status`,
      [testWhName, testPhone, testProvince, testCity, testAddress, testPic]
    );

    createdWarehouseId = insertWhRes.rows[0].id;
    console.log(`✅ Warehouse created successfully with ID: ${createdWarehouseId}`);
    console.log(`   Name: ${insertWhRes.rows[0].name}`);
    console.log(`   Location: ${insertWhRes.rows[0].city}, ${insertWhRes.rows[0].province}`);
    console.log(`   Phone: ${insertWhRes.rows[0].phone}`);

    // [3/6] Verify Warehouse in PostgreSQL
    console.log("\n[3/6] Verifying warehouse fields in DB...");
    const verifyWhRes = await pool.query(
      'SELECT id, name, phone, province, city, address, "picName", status FROM warehouses WHERE id = $1',
      [createdWarehouseId]
    );
    if (verifyWhRes.rows.length === 0) {
      throw new Error("❌ Warehouse not found in database!");
    }
    const wh = verifyWhRes.rows[0];
    if (wh.city !== testCity || wh.phone !== testPhone || wh.province !== testProvince || wh.address !== testAddress) {
      throw new Error("❌ Warehouse field values mismatch!");
    }
    console.log(`✅ Verified all G-SERP fields match exactly in DB.`);

    // [4/6] Update Warehouse
    console.log("\n[4/6] Updating warehouse details...");
    const updatedName = `${testWhName} (Updated)`;
    const updatedCity = 'Kota Surabaya';
    await pool.query(
      'UPDATE warehouses SET name = $1, city = $2, "updatedAt" = NOW() WHERE id = $3',
      [updatedName, updatedCity, createdWarehouseId]
    );
    const verifyUpdate = await pool.query(
      'SELECT name, city FROM warehouses WHERE id = $1',
      [createdWarehouseId]
    );
    if (verifyUpdate.rows[0].name !== updatedName || verifyUpdate.rows[0].city !== updatedCity) {
      throw new Error("❌ Warehouse update verification failed!");
    }
    console.log(`✅ Warehouse successfully updated: ${verifyUpdate.rows[0].name} (${verifyUpdate.rows[0].city})`);

    // [5/6] Test Warehouse Access Management (Grant & Sync)
    console.log("\n[5/6] Testing Warehouse Access RBAC per user...");
    const userRes = await pool.query('SELECT id, email, "fullName" FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      throw new Error("❌ No test user found in DB!");
    }
    testUserId = userRes.rows[0].id;
    console.log(`Using test user: ${userRes.rows[0].fullName || userRes.rows[0].email} (${testUserId})`);

    // Step A: Grant access to created warehouse
    await pool.query(
      `INSERT INTO warehouse_access (
        id, "userId", "warehouseId", "canRead", "canWrite", "canApprove", "grantedAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, true, true, false, NOW()
      )`,
      [testUserId, createdWarehouseId]
    );

    const checkAccess1 = await pool.query(
      'SELECT * FROM warehouse_access WHERE "userId" = $1 AND "warehouseId" = $2',
      [testUserId, createdWarehouseId]
    );
    if (checkAccess1.rows.length === 0 || !checkAccess1.rows[0].canRead || !checkAccess1.rows[0].canWrite) {
      throw new Error("❌ Failed to grant warehouse access in DB!");
    }
    console.log(`✅ Access granted for user to warehouse: canRead=${checkAccess1.rows[0].canRead}, canWrite=${checkAccess1.rows[0].canWrite}`);

    // Step B: Atomic sync/revoke
    console.log("   Testing access revocation & sync...");
    await pool.query(
      'DELETE FROM warehouse_access WHERE "userId" = $1 AND "warehouseId" = $2',
      [testUserId, createdWarehouseId]
    );
    const checkAccessRevoked = await pool.query(
      'SELECT * FROM warehouse_access WHERE "userId" = $1 AND "warehouseId" = $2',
      [testUserId, createdWarehouseId]
    );
    if (checkAccessRevoked.rows.length !== 0) {
      throw new Error("❌ Failed to revoke warehouse access in DB!");
    }
    console.log("✅ Access successfully revoked and synced.");

    // [6/6] Cleanup Test Warehouse
    console.log("\n[6/6] Cleaning up test data...");
    await pool.query('DELETE FROM warehouses WHERE id = $1', [createdWarehouseId]);
    const checkDeleted = await pool.query('SELECT id FROM warehouses WHERE id = $1', [createdWarehouseId]);
    if (checkDeleted.rows.length !== 0) {
      throw new Error("❌ Cleanup failed: warehouse still exists!");
    }
    console.log("✅ Test warehouse successfully cleaned up.");

    console.log("\n=======================================================");
    console.log("🎉 ALL SUB-FASE 1.4 AUTOMATED INTEGRATION TESTS PASSED!");
    console.log("=======================================================\n");

  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
    if (createdWarehouseId) {
      await pool.query('DELETE FROM warehouse_access WHERE "warehouseId" = $1', [createdWarehouseId]).catch(() => {});
      await pool.query('DELETE FROM warehouses WHERE id = $1', [createdWarehouseId]).catch(() => {});
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
