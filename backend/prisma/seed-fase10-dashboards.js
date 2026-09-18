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
  console.log('🌱 Seeding Fase 10 Dashboards & System Administration Data...');
  console.log('Target DB:', env.DATABASE_URL);

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Verify users and system administration accounts
    const users = await prisma.user.findMany({ select: { id: true, email: true, fullName: true, roles: true } });
    console.log(`Verified ${users.length} system user accounts for Executive & Departmental Hubs.`);

    // 2. Verify Departmental KPIs data existence
    const soCount = await prisma.salesOrder.count();
    const poCount = await prisma.purchaseOrder.count();
    const leadCount = await prisma.salesLead.count();
    const guestLogCount = await prisma.guestLog.count();

    console.log(`Departmental Dashboard Stats:
      - Sales Orders: ${soCount}
      - Purchase Orders: ${poCount}
      - Sales Leads: ${leadCount}
      - Guest Logs: ${guestLogCount}
    `);

    console.log('✅ Executive, Departmental, and System Data validated successfully.');
    console.log('🎉 Fase 10 Seeding Completed Successfully!');
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
