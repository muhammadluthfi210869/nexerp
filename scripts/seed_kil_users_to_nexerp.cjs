const fs = require('fs');
const path = require('path');
const { Pool } = require('../backend/node_modules/pg');
const bcrypt = require('../backend/node_modules/bcrypt');

// Read DATABASE_URL from backend/.env if possible, otherwise fallback
let connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../backend/.env'), 'utf8');
  const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (dbMatch) {
    connectionString = dbMatch[1];
  }
} catch (e) {
  console.log('Using default connection string');
}

const pool = new Pool({ connectionString });

function mapRoles(kilRole) {
  const r = (kilRole || '').replace(/&amp;/g, '&').trim();
  switch (r) {
    case 'Administrator':
      return ['SUPER_ADMIN', 'ADMIN'];
    case 'Administrator BD':
      return ['COMMERCIAL', 'ADMIN'];
    case 'Head Research and Development':
      return ['RND', 'HEAD_OPS'];
    case 'Research and Development':
      return ['RND'];
    case 'Production Mixing & Filling':
      return ['PRODUCTION', 'PRODUCTION_OP'];
    case 'Warehouse':
      return ['WAREHOUSE'];
    case 'Business Development':
    case 'Business Development BD':
      return ['COMMERCIAL'];
    case 'Production Packaging':
      return ['PRODUCTION_OP'];
    case 'BusDev + Purchasing BD':
    case 'BusDev + Purchasing':
      return ['COMMERCIAL', 'PURCHASING'];
    case 'Finance':
      return ['FINANCE'];
    case 'HRD':
      return ['HR'];
    case 'Apoteker Penanggung Jawab':
      return ['APJ', 'COMPLIANCE'];
    case 'BusDev + HRD BD':
    case 'BusDev + HRD':
      return ['COMMERCIAL', 'HR'];
    case 'Staff Back Office':
      return ['ADMIN'];
    case 'Head Business Development BD':
    case 'Head Business Development':
      return ['COMMERCIAL', 'HEAD_OPS'];
    case 'Digital Marketing':
      return ['DIGIMAR', 'MARKETING'];
    case 'Purchasing':
      return ['PURCHASING', 'SCM'];
    default:
      return ['ADMIN'];
  }
}

function deriveEmail(u) {
  if (u.email.includes('goodsyst')) return 'superadmin@nexerp.id';
  const localPart = u.email.split('@')[0].trim().toLowerCase();
  return localPart + '@nexerp.id';
}

async function seed() {
  console.log('Connecting to database:', connectionString.replace(/:[^:@]+@/, ':***@'));
  const client = await pool.connect();
  try {
    // 1. Get default organizationId
    const orgRes = await client.query('SELECT "organizationId" FROM users WHERE "organizationId" IS NOT NULL LIMIT 1');
    const defaultOrgId = orgRes.rows[0]?.organizationId || 'a0000000-0000-4000-8000-000000000001';
    console.log('Default organizationId:', defaultOrgId);

    // 2. Hash password: password123
    console.log('Hashing password "password123"...');
    const passwordHash = await bcrypt.hash('password123', 10);

    // 3. Load KIL extracted users
    const dataPath = path.join(__dirname, 'kil_full_extracted_data.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Loaded ${rawData.users.length} users from ${dataPath}`);

    const results = [];

    await client.query('BEGIN');

    for (const u of rawData.users) {
      const nip = u.nip.trim();
      const fullName = u.name.trim();
      const email = deriveEmail(u);
      const phone = u.phone.trim();
      const roles = mapRoles(u.role);
      const isBd = roles.includes('COMMERCIAL') || u.role.toLowerCase().includes('bd') || u.role.toLowerCase().includes('business development');

      // Check if user exists by email or code
      const checkRes = await client.query(
        'SELECT id, email, code FROM users WHERE email = $1 OR (code IS NOT NULL AND code = $2)',
        [email, nip]
      );

      let action = '';
      let userId = '';

      if (checkRes.rows.length > 0) {
        // Update existing user
        userId = checkRes.rows[0].id;
        await client.query(
          `UPDATE users 
           SET email = $1,
               code = $2,
               "fullName" = $3,
               phone = $4,
               "passwordHash" = $5,
               roles = $6::"UserRole"[],
               status = 'ACTIVE'::"UserStatus",
               "isBd" = $7,
               "organizationId" = $8,
               "deletedAt" = NULL
           WHERE id = $9`,
          [email, nip, fullName, phone, passwordHash, roles, isBd, defaultOrgId, userId]
        );
        action = 'UPDATED';
      } else {
        // Insert new user
        const insertRes = await client.query(
          `INSERT INTO users (
             id, code, "fullName", email, phone, "passwordHash", roles, status, "isBd", "organizationId", "createdAt"
           ) VALUES (
             gen_random_uuid(), $1, $2, $3, $4, $5, $6::"UserRole"[], 'ACTIVE'::"UserStatus", $7, $8, NOW()
           ) RETURNING id`,
          [nip, fullName, email, phone, passwordHash, roles, isBd, defaultOrgId]
        );
        userId = insertRes.rows[0].id;
        action = 'INSERTED';
      }

      results.push({
        nip,
        fullName,
        email,
        phone,
        roles: roles.join(', '),
        isBd,
        action
      });
    }

    await client.query('COMMIT');
    console.log(`\nSuccessfully processed ${results.length} accounts into database!`);
    console.table(results.map(r => ({
      NIP: r.nip,
      Nama: r.fullName,
      Email: r.email,
      Roles: r.roles,
      BD: r.isBd ? 'YES' : 'NO',
      Status: r.action
    })));

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
