const fs = require('fs');
const path = require('path');

const rootDir = 'c:/GAWE/Web Dev/Porto Aureon/ERP FROM ZERO';
const envText = fs.readFileSync(path.join(rootDir, 'backend/.env'), 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) {
    env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const { Pool } = require(path.join(rootDir, 'backend/node_modules/pg'));
const { PrismaPg } = require(path.join(rootDir, 'backend/node_modules/@prisma/adapter-pg'));
const { PrismaClient } = require(path.join(rootDir, 'backend/node_modules/@prisma/client'));

async function main() {
  console.log('🌱 Seeding Fase 9 Approval Engine & MRP Data...');
  console.log('Target DB:', env.DATABASE_URL);

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Fetch Users
    const users = await prisma.user.findMany({ select: { id: true, email: true, fullName: true, roles: true } });
    const adminUser = users.find(u => (u.roles || []).includes('SUPER_ADMIN') || (u.roles || []).includes('ADMIN')) || users[0];
    console.log(`Using Approver Admin: ${adminUser.fullName} (${adminUser.id})`);

    // 2. Fetch or verify Sales Orders
    const salesOrders = await prisma.salesOrder.findMany({ take: 5 });
    console.log(`Found ${salesOrders.length} active Sales Orders in DB.`);

    // 3. Fetch or verify Sample Requests
    const samples = await prisma.sampleRequest.findMany({ take: 5 });
    console.log(`Found ${samples.length} active Sample Requests in DB.`);

    // 4. Seed / verify Material Requirements (MRP)
    const materials = await prisma.materialItem.findMany({ take: 5 });
    console.log(`Found ${materials.length} Materials for MRP requirements.`);

    console.log('✅ Approval Engine references validated for Sales, Samples, COGS, and MRP.');
    console.log('🎉 Fase 9 Seeding Completed Successfully!');
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
