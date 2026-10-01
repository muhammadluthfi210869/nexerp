const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  console.log("--- 🧪 STARTING SUB-FASE 1.7: HAK AKSES (ROLE) & PENGGUNA (USER) INTEGRATION TEST ---\n");

  let createdUserId = null;

  try {
    // [1/8] Verify Users Table Schema Columns
    console.log("[1/8] Verifying users table schema columns in PostgreSQL...");
    const colRes = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name IN ('code', 'phone', 'isBd', 'email', 'fullName', 'roles', 'status', 'deletedAt')
    `);
    const cols = colRes.rows.map(r => r.column_name);
    console.log(`✅ Detected columns: ${cols.join(', ')}`);
    const required = ['code', 'phone', 'isBd', 'email', 'fullName', 'roles', 'status', 'deletedAt'];
    for (const req of required) {
      if (!cols.includes(req)) {
        throw new Error(`❌ Missing required column '${req}' in users table!`);
      }
    }

    // Clean up any test user from prior runs
    await pool.query(`DELETE FROM users WHERE email = 'test.sales.sub17@dreamlab.id' OR code = 'PEG-TEST-99'`);

    // [2/8] Verify Seeded Users Data Integrity
    console.log("\n[2/8] Verifying existing users data integrity...");
    const statsRes = await pool.query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(code)::int as with_code,
        COUNT(phone)::int as with_phone,
        COUNT(CASE WHEN "isBd" = true THEN 1 END)::int as with_is_bd,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END)::int as active_users
      FROM users
    `);
    const stats = statsRes.rows[0];
    console.log(`✅ Total Users in DB: ${stats.total}`);
    console.log(`   - With NIP / Code: ${stats.with_code}`);
    console.log(`   - With Phone: ${stats.with_phone}`);
    console.log(`   - Flagged as BusDev (isBd=true): ${stats.with_is_bd}`);
    console.log(`   - Active Status: ${stats.active_users}`);
    if (stats.total === 0 || stats.with_code !== stats.total) {
      throw new Error(`❌ Discrepancy in user code integrity! Total: ${stats.total}, with code: ${stats.with_code}`);
    }

    // [3/8] Test CREATE User with code, phone, isBd
    console.log("\n[3/8] Testing CREATE User in PostgreSQL...");
    const testCode = "PEG-TEST-99";
    const testEmail = "test.sales.sub17@dreamlab.id";
    const testName = "Budi Hartono (Test Subfase 1.7)";
    const testPhone = "081299998888";
    const testRoles = ["COMMERCIAL"];
    const testIsBd = true;

    const insertRes = await pool.query(`
      INSERT INTO users (
        id, email, "fullName", code, phone, "isBd", roles, status, "createdAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'ACTIVE', NOW()
      ) RETURNING id, email, "fullName", code, phone, "isBd", roles, status, "deletedAt"
    `, [testEmail, testName, testCode, testPhone, testIsBd, testRoles]);

    const created = insertRes.rows[0];
    createdUserId = created.id;
    console.log(`✅ User created successfully: ID=${created.id}, NIP=${created.code}, Nama=${created.fullName}`);
    if (created.code !== testCode || created.phone !== testPhone || created.isBd !== true) {
      throw new Error("❌ Created user fields do not match expected values!");
    }

    // [4/8] Test READ User by Code and Filter by isBd
    console.log("\n[4/8] Testing READ & Filter Users...");
    const readRes = await pool.query(`
      SELECT id, code, "fullName", email, phone, "isBd", roles, status 
      FROM users 
      WHERE code = $1
    `, [testCode]);
    if (readRes.rows.length === 0) {
      throw new Error(`❌ User not found by code ${testCode}!`);
    }
    console.log(`✅ Queried by Code: found ${readRes.rows[0].fullName} (${readRes.rows[0].email})`);

    const bdQueryRes = await pool.query(`
      SELECT COUNT(*)::int as bd_count 
      FROM users 
      WHERE "isBd" = true AND id = $1
    `, [createdUserId]);
    if (bdQueryRes.rows[0].bd_count !== 1) {
      throw new Error("❌ Filter by isBd failed to return created BusDev user!");
    }
    console.log(`✅ Filter by isBd=true confirmed.`);

    // [5/8] Test UPDATE User (NIP, phone, roles, isBd)
    console.log("\n[5/8] Testing UPDATE User in PostgreSQL...");
    const updatedPhone = "081299999999";
    const updatedRoles = ["DIRECTOR"];
    const updateRes = await pool.query(`
      UPDATE users 
      SET phone = $1, roles = $2, "isBd" = false
      WHERE id = $3
      RETURNING id, code, phone, roles, "isBd"
    `, [updatedPhone, updatedRoles, createdUserId]);

    const updated = updateRes.rows[0];
    console.log(`✅ User updated: Phone=${updated.phone}, Roles=${JSON.stringify(updated.roles)}, isBd=${updated.isBd}`);
    if (updated.phone !== updatedPhone || updated.isBd !== false) {
      throw new Error("❌ Update user verification failed!");
    }

    // [6/8] Test DEACTIVATE User (Status INACTIVE + deletedAt timestamp)
    console.log("\n[6/8] Testing DEACTIVATE User (Soft-delete)...");
    const deactRes = await pool.query(`
      UPDATE users 
      SET status = 'INACTIVE', "deletedAt" = NOW()
      WHERE id = $1
      RETURNING id, status, "deletedAt"
    `, [createdUserId]);

    const deactivated = deactRes.rows[0];
    console.log(`✅ User deactivated: Status=${deactivated.status}, DeletedAt=${deactivated.deletedAt}`);
    if (deactivated.status !== 'INACTIVE' || !deactivated.deletedAt) {
      throw new Error("❌ Deactivate user verification failed!");
    }

    // [7/8] Test REACTIVATE User (Status ACTIVE + deletedAt null)
    console.log("\n[7/8] Testing REACTIVATE User...");
    const reactRes = await pool.query(`
      UPDATE users 
      SET status = 'ACTIVE', "deletedAt" = NULL
      WHERE id = $1
      RETURNING id, status, "deletedAt"
    `, [createdUserId]);

    const reactivated = reactRes.rows[0];
    console.log(`✅ User reactivated: Status=${reactivated.status}, DeletedAt=${reactivated.deletedAt}`);
    if (reactivated.status !== 'ACTIVE' || reactivated.deletedAt !== null) {
      throw new Error("❌ Reactivate user verification failed!");
    }

    // [8/8] Verify Roles Configuration Table or Permission List
    console.log("\n[8/8] Verifying Roles & Permissions in Database...");
    const rolesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'roles'
    `);
    if (rolesRes.rows.length > 0) {
      const allRoles = await pool.query(`SELECT id, name, slug FROM roles`);
      console.log(`✅ Found ${allRoles.rows.length} roles in 'roles' table.`);
      allRoles.rows.slice(0, 5).forEach(r => console.log(`   - ${r.name} (${r.slug})`));
    } else {
      console.log(`ℹ️ Canonical role list handled via enums/auth config. Verified users' distinct roles.`);
      const distinctRoles = await pool.query(`SELECT DISTINCT unnest(roles) as role FROM users ORDER BY role`);
      console.log(`✅ Distinct active user roles in system: ${distinctRoles.rows.map(r => r.role).join(', ')}`);
    }

    console.log("\n=======================================================");
    console.log("🎉 SUB-FASE 1.7: HAK AKSES & PENGGUNA VERIFICATION PASSED (8/8)");
    console.log("=======================================================\n");

  } catch (err) {
    console.error("\n❌ SUB-FASE 1.7 TEST FAILED:", err);
    process.exitCode = 1;
  } finally {
    // Cleanup test user
    if (createdUserId) {
      await pool.query(`DELETE FROM users WHERE id = $1`, [createdUserId]);
      console.log("🧹 Cleanup: Test user removed from database.");
    }
    await pool.end();
  }
}

main();
