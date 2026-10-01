const { Pool } = require('../backend/node_modules/pg');
const bcrypt = require('../backend/node_modules/bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  const res = await pool.query(`
    SELECT id, email, roles, status, "passwordHash"
    FROM users
    WHERE 'SUPER_ADMIN' = ANY(roles) OR email ILIKE '%admin%' OR email ILIKE '%zaki%' OR email ILIKE '%luthfi%'
  `);
  console.log('Matching users:', res.rows.map(r => ({
    email: r.email,
    roles: r.roles,
    status: r.status,
    hasHash: Boolean(r.passwordHash)
  })));

  // Test bcrypt verify on found users with common passwords.
  // Kredensial nyata yang pernah bocor sengaja TIDAK ada di sini: menambahkannya
  // tidak menambah deteksi (sudah diketahui) hanya menyalin rahasia ke source.
  const testPw = ['password123', 'admin123', 'admin', 'password', 'admin1234', '123456'];
  for (const user of res.rows) {
    for (const pw of testPw) {
      const match = await bcrypt.compare(pw, user.passwordHash).catch(() => false);
      if (match) {
        console.log(`FOUND CREDENTIAL MATCH! Email: ${user.email} | Password: ${pw}`);
      }
    }
  }

  await pool.end();
}

main().catch(console.error);
