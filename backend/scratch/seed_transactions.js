const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log('Seeding Transactions...');
  
  try {
    // 1. Initial Capital
    const acc1110 = await prisma.account.findUnique({ where: { code: '1110' } });
    const acc3100 = await prisma.account.findUnique({ where: { code: '3100' } });
    const acc4101 = await prisma.account.findUnique({ where: { code: '4101' } });
    const acc6201 = await prisma.account.findUnique({ where: { code: '6201' } });

    if (!acc1110 || !acc3100 || !acc4101 || !acc6201) {
      console.error('Some accounts not found. Run seed-coa-v2 first.');
      return;
    }

    await prisma.journalEntry.create({
      data: {
        date: new Date('2026-04-01'),
        description: 'Setoran Modal Awal',
        reference: 'JV/001',
        lines: {
          create: [
            { accountId: acc1110.id, debit: 1000000000, credit: 0 },
            { accountId: acc3100.id, debit: 0, credit: 1000000000 },
          ]
        }
      }
    });

    await prisma.journalEntry.create({
      data: {
        date: new Date('2026-04-10'),
        description: 'Penjualan Maklon Batch 01',
        reference: 'INV/001',
        lines: {
          create: [
            { accountId: acc1110.id, debit: 250000000, credit: 0 },
            { accountId: acc4101.id, debit: 0, credit: 250000000 },
          ]
        }
      }
    });

    await prisma.journalEntry.create({
      data: {
        date: new Date('2026-04-25'),
        description: 'Gaji Karyawan April',
        reference: 'PYR/001',
        lines: {
          create: [
            { accountId: acc6201.id, debit: 50000000, credit: 0 },
            { accountId: acc1110.id, debit: 0, credit: 50000000 },
          ]
        }
      }
    });

    console.log('Transactions Seeded Successfully!');
  } catch (error) {
    console.error('Error seeding transactions:', error);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

run();
