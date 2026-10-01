const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const { PrismaPg } = require('../backend/node_modules/@prisma/adapter-pg');
const { Pool } = require('../backend/node_modules/pg');

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public';
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runTest() {
  console.log('--- 🧪 STARTING SUB-FASE 1.1: MASTER SUPPLIER FULL-STACK TEST ---');

  // 1. Verify Supplier Categories exist
  console.log('\n[1/5] Checking Supplier Categories...');
  const categories = await prisma.masterCategory.findMany({
    where: { type: 'SUPPLIER' }
  });
  console.log(`Found ${categories.length} supplier categories:`, categories.map(c => `${c.code}: ${c.name}`).join(', '));
  if (categories.length === 0) {
    throw new Error('FAILED: No supplier categories found in database!');
  }
  const targetCategory = categories[0];

  // 2. Create Supplier with Tax, City, Province, PIC, Description, CategoryId
  console.log('\n[2/5] Testing Supplier Creation in PostgreSQL (Zero-Mock)...');
  const testName = `PT Parity Test Supplier ${Date.now()}`;
  const created = await prisma.supplier.create({
    data: {
      name: testName,
      contact: 'Bpk. Ahmad Subandi',
      phone: '081298765432',
      email: 'ahmad@paritysupplier.co.id',
      province: 'Jawa Timur',
      city: 'Kota Surabaya',
      address: 'Jl. Rungkut Industri No. 45',
      tax: 12.00,
      description: 'Pemasok bahan baku bersertifikat COA & Halal resmi',
      categoryId: targetCategory.id,
      termOfPayment: 30
    },
    include: {
      category: true
    }
  });

  console.log('✅ Created Supplier ID:', created.id);
  console.log('  - Name:', created.name);
  console.log('  - PIC (contact):', created.contact);
  console.log('  - Phone:', created.phone);
  console.log('  - City:', created.city);
  console.log('  - Province:', created.province);
  console.log('  - Tax (%):', Number(created.tax));
  console.log('  - Description:', created.description);
  console.log('  - Category:', created.category ? `${created.category.code} - ${created.category.name}` : 'NONE');

  if (Number(created.tax) !== 12) {
    throw new Error(`FAILED: Tax mismatch! Expected 12, got ${created.tax}`);
  }
  if (!created.category || created.category.id !== targetCategory.id) {
    throw new Error('FAILED: Category relationship not properly established!');
  }

  // 3. Query & Verify in List
  console.log('\n[3/5] Testing Supplier Query & Field Parity...');
  const found = await prisma.supplier.findFirst({
    where: { id: created.id },
    include: { category: true }
  });
  if (!found || found.name !== testName) {
    throw new Error('FAILED: Supplier not retrievable via query!');
  }
  console.log('✅ Found supplier in query with complete relations.');

  // 4. Update Supplier
  console.log('\n[4/5] Testing Supplier Update...');
  const updated = await prisma.supplier.update({
    where: { id: created.id },
    data: {
      tax: 11.00,
      city: 'Kota Sidoarjo',
      description: 'Updated terms: COD & tempo 45 hari'
    }
  });
  console.log('✅ Updated Tax to:', Number(updated.tax), 'and City to:', updated.city);
  if (Number(updated.tax) !== 11 || updated.city !== 'Kota Sidoarjo') {
    throw new Error('FAILED: Update verification failed!');
  }

  // 5. Cleanup test record
  console.log('\n[5/5] Cleaning up test supplier...');
  await prisma.supplier.delete({ where: { id: created.id } });
  console.log('✅ Cleaned up successfully.');

  console.log('\n🎉 ALL 5 SUB-FASE 1.1 BACKEND & DATABASE TESTS PASSED WITH 100% SUCCESS!');
  await prisma.$disconnect();
  await pool.end();
}

runTest().catch(async (e) => {
  console.error('❌ TEST FAILED:', e);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
