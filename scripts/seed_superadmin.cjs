const { Pool } = require('../backend/node_modules/pg');
const bcrypt = require('../backend/node_modules/bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  
  // Check if superadmin@nexerp.id exists
  const existing = await pool.query(`SELECT id FROM users WHERE email = 'superadmin@nexerp.id'`);
  if (existing.rows.length === 0) {
    // Get organizationId from admin@nexerp.id
    const admin = await pool.query(`SELECT "organizationId" FROM users WHERE email = 'admin@nexerp.id' LIMIT 1`);
    const orgId = admin.rows[0]?.organizationId;

    await pool.query(`
      INSERT INTO users (id, "fullName", email, "passwordHash", roles, status, "createdAt", "organizationId")
      VALUES (gen_random_uuid(), 'Super Admin', 'superadmin@nexerp.id', $1, ARRAY['SUPER_ADMIN'::"UserRole"], 'ACTIVE'::"UserStatus", NOW(), $2)
    `, [hash, orgId]);
    console.log('Successfully created superadmin@nexerp.id with password: password123');
  } else {
    await pool.query(`
      UPDATE users SET "passwordHash" = $1, roles = ARRAY['SUPER_ADMIN'::"UserRole"], status = 'ACTIVE'::"UserStatus"
      WHERE email = 'superadmin@nexerp.id'
    `, [hash]);
    console.log('Successfully updated superadmin@nexerp.id with password: password123');
  }

  await pool.end();
}

main().catch(console.error);
