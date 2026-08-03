#!/usr/bin/env node
/**
 * Upsert user DIGIMAR (Luthfi & Rahmat) ke DB yang sudah ada.
 *
 * Kenapa perlu script ini?
 *   - init-db.sh hanya menjalankan seed saat DB masih kosong (user count == 0).
 *   - Untuk DB yang sudah terisi, update seed.ts saja tidak cukup.
 *
 * Cara pakai:
 *   DATABASE_URL="postgresql://user:pass@host:port/db?schema=public" node scripts/upsert-digimar-users.js
 */
require('dotenv/config');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const PASSWORD = process.env.UPSERT_PASSWORD || 'password123';

const USERS = [
  { email: 'luthfi@nexerp.id', fullName: 'Luthfi', roles: ['DIGIMAR'] },
  { email: 'luthfi@dreamlab.com', fullName: 'Luthfi', roles: ['DIGIMAR'] },
  { email: 'rahmat@nexerp.id', fullName: 'Rahmat', roles: ['DIGIMAR'] },
  { email: 'rahmat@dreamlab.com', fullName: 'Rahmat', roles: ['DIGIMAR'] },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL tidak di-set.');
    process.exit(1);
  }
  const pool = new Pool({ connectionString });
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const u of USERS) {
    const result = await pool.query(
      `INSERT INTO users (id, email, "fullName", "passwordHash", roles, status, "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'ACTIVE', NOW())
       ON CONFLICT (email) DO UPDATE
         SET "fullName" = EXCLUDED."fullName",
             "passwordHash" = EXCLUDED."passwordHash",
             roles = EXCLUDED.roles,
             status = 'ACTIVE',
             "deletedAt" = NULL
       RETURNING email, "fullName", roles;`,
      [u.email, u.fullName, passwordHash, u.roles],
    );
    const row = result.rows[0];
    console.log(`  ✅ ${row.fullName} (${row.email}) roles: ${Array.isArray(row.roles) ? row.roles.join(',') : row.roles}`);
  }

  console.log(`\n🔑 Password untuk semua akun: ${PASSWORD}`);
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Upsert gagal:', err.message);
  process.exit(1);
});
