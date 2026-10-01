const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  console.log("Applying user schema migration for Sub-Fase 1.7...");

  // 1. Add code, phone, isBd
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS code text;
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "isBd" boolean DEFAULT false;
  `);

  // Ensure unique index on code (where code is not null)
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_code_unique_idx ON users(code) WHERE code IS NOT NULL;
  `);

  console.log("✅ Added code, phone, isBd columns and unique index to users");

  // 2. Backfill existing users with sequential NIP if empty
  const users = await pool.query(`SELECT id, "fullName", email, code, phone, roles FROM users ORDER BY "createdAt" ASC`);
  let idx = 1;
  for (const u of users.rows) {
    const nip = u.code || `PEG-${String(idx).padStart(4, '0')}`;
    const samplePhone = u.phone || `0812${String(idx * 11111111).slice(0, 8)}`;
    const isCommercial = Array.isArray(u.roles) && (u.roles.includes('COMMERCIAL') || u.roles.includes('MARKETING') || u.roles.includes('ADMIN'));
    
    await pool.query(
      `UPDATE users SET code = $1, phone = $2, "isBd" = $3 WHERE id = $4 AND (code IS NULL OR phone IS NULL)`,
      [nip, samplePhone, isCommercial, u.id]
    );
    idx++;
  }

  console.log(`✅ Backfilled NIP and phone for ${users.rows.length} existing users`);
  await pool.end();
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
