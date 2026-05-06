
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function debug() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'FOUND' : 'MISSING');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Testing connection...');
    await prisma.$connect();
    console.log('Connected.');

    console.log('Testing Revenue query...');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const rev = await prisma.finalInvoice.aggregate({
      where: { status: 'PAID', paidAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    });
    console.log('Revenue:', rev);

    console.log('Testing Pipeline query...');
    const leads = await prisma.salesLead.groupBy({
      by: ['stage'],
      _count: { _all: true },
    });
    console.log('Leads:', leads);

    console.log('Testing Production query...');
    const active = await prisma.productionPlan.count({
        where: { status: { not: 'DONE' } },
    });
    console.log('Active Plans:', active);

    console.log('Testing Alert Production query...');
    const activePlans = await prisma.productionPlan.findMany({
        where: { status: { not: 'DONE' } },
        include: { so: true }
    });
    console.log('Active Plans with SO:', activePlans.length);

    console.log('Testing Retention query...');
    const retention = await prisma.retentionEngine.count({
        where: { status: 'WAITING' }
    });
    console.log('Retention:', retention);

  } catch (e) {
    console.error('DEBUG ERROR:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

debug();
