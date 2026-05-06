const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    const lead = await prisma.lead.findFirst();
    const sample = await prisma.sample.findFirst();
    const formula = await prisma.formula.findFirst();
    const user = await prisma.user.findFirst({ where: { role: 'PRODUCTION' }});

    console.log('Got dependencies, creating SO...');

    const salesOrder = await prisma.salesOrder.upsert({
      where: { id: 'SO-2026-001' },
      update: {},
      create: {
        id: 'SO-2026-001',
        lead_id: lead.id,
        sample_id: sample.id,
        total_amount: 1000000,
        status: 'ACTIVE',
      }
    });

    console.log('SO created. Creating ProductionPlan...');
    await prisma.productionPlan.upsert({
      where: { batch_no: 'BCH-2026-001' },
      update: {},
      create: {
        batch_no: 'BCH-2026-001',
        admin_id: user.id,
        so_id: salesOrder.id,
        status: 'ON_PROGRESS'
      }
    });
    console.log('Success!');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
