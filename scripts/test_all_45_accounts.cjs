const fs = require('fs');
const path = require('path');
const { Pool } = require('../backend/node_modules/pg');
const bcrypt = require('../backend/node_modules/bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  console.log('=====================================================');
  console.log('🧪 TESTING ALL 45 SEEDED KIL ACCOUNTS IN NEX ERP DB');
  console.log('=====================================================\n');

  // Load expected accounts from KIL JSON
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'kil_full_extracted_data.json'), 'utf8'));
  const totalExpected = raw.users.length;
  console.log(`Target accounts to verify: ${totalExpected}\n`);

  let passed = 0;
  let failed = 0;
  const failureDetails = [];

  for (let i = 0; i < raw.users.length; i++) {
    const u = raw.users[i];
    const nip = u.nip.trim();
    let email = u.email.split('@')[0].trim().toLowerCase() + '@nexerp.id';
    if (u.email.includes('goodsyst')) email = 'superadmin@nexerp.id';

    const res = await pool.query(
      'SELECT id, code, email, "fullName", phone, roles, status, "isBd", "passwordHash", "organizationId" FROM users WHERE email = $1',
      [email]
    );

    if (res.rows.length === 0) {
      failed++;
      failureDetails.push({ email, error: 'User not found in DB' });
      console.log(`❌ [${(i + 1).toString().padStart(2)}] ${email} - NOT FOUND`);
      continue;
    }

    const dbUser = res.rows[0];

    // 1. Password check
    const isPasswordValid = await bcrypt.compare('password123', dbUser.passwordHash);
    if (!isPasswordValid) {
      failed++;
      failureDetails.push({ email, error: 'Password hash does not match "password123"' });
      console.log(`❌ [${(i + 1).toString().padStart(2)}] ${email} - INVALID PASSWORD`);
      continue;
    }

    // 2. Status check
    if (dbUser.status !== 'ACTIVE') {
      failed++;
      failureDetails.push({ email, error: `Invalid status: ${dbUser.status}` });
      console.log(`❌ [${(i + 1).toString().padStart(2)}] ${email} - STATUS NOT ACTIVE`);
      continue;
    }

    // 3. Roles check
    if (!dbUser.roles || dbUser.roles.length === 0) {
      failed++;
      failureDetails.push({ email, error: 'Roles array is empty' });
      console.log(`❌ [${(i + 1).toString().padStart(2)}] ${email} - EMPTY ROLES`);
      continue;
    }

    // 4. Code / NIP check
    if (dbUser.code !== nip) {
      failed++;
      failureDetails.push({ email, error: `NIP mismatch: expected ${nip}, got ${dbUser.code}` });
      console.log(`❌ [${(i + 1).toString().padStart(2)}] ${email} - NIP MISMATCH`);
      continue;
    }

    passed++;
    const rolesStr = Array.isArray(dbUser.roles) ? dbUser.roles.join(', ') : dbUser.roles;
    console.log(`✅ [${(i + 1).toString().padStart(2)}] ${dbUser.code.padEnd(8)} | ${dbUser.fullName.padEnd(25)} | ${dbUser.email.padEnd(35)} | Roles: [${rolesStr}] | BD: ${dbUser.isBd ? 'YES' : 'NO'}`);
  }

  console.log('\n=====================================================');
  console.log(`📊 TEST RESULT: ${passed}/${totalExpected} PASSED (${Math.round((passed / totalExpected) * 100)}%)`);
  if (failed > 0) {
    console.log(`❌ FAILURES (${failed}):`);
    console.table(failureDetails);
  } else {
    console.log('🎉 ALL 45 ACCOUNTS ARE 100% VERIFIED & READY FOR LOGIN!');
  }
  console.log('=====================================================\n');

  await pool.end();
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
