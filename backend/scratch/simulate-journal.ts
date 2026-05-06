import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simulate() {
  console.log('Simulating first Double-Entry transaction...');

  // 1. Get account IDs
  const cashAcc = await prisma.account.findUnique({ where: { code: '1100' } });
  const revenueAcc = await prisma.account.findUnique({ where: { code: '4100' } });

  if (!cashAcc || !revenueAcc) {
    throw new Error('Required accounts (1100, 4100) not found. Please seed CoA first.');
  }

  // 2. Create Journal Entry (Atomic)
  const entry = await prisma.journalEntry.create({
    data: {
      date: new Date(),
      reference: 'SIM-001/2026',
      description: 'Pelunasan Jasa Konsultasi Strategis - Proyek Dreamlab Alpha',
      lines: {
        create: [
          {
            accountId: cashAcc.id,
            debit: 10000000,
            credit: 0,
          },
          {
            accountId: revenueAcc.id,
            debit: 0,
            credit: 10000000,
          }
        ]
      }
    },
    include: { lines: true }
  });

  console.log('Simulation Entry Created Successfully!');
  console.log('Entry ID:', entry.id);
  console.log('Balanced Status: DEBIT 10.000.000 = CREDIT 10.000.000');
}

simulate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
