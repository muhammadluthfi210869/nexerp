import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Bootstrapping Phase 3 Master Data...');

  // 1. Currencies
  const idr = await prisma.currency.upsert({
    where: { code: 'IDR' },
    update: {},
    create: {
      code: 'IDR',
      symbol: 'Rp',
      exchangeRate: 1.0,
      isMain: true,
    },
  });

  const usd = await prisma.currency.upsert({
    where: { code: 'USD' },
    update: {},
    create: {
      code: 'USD',
      symbol: '$',
      exchangeRate: 15500.0,
      isMain: false,
    },
  });

  // 2. Tax Rates
  await prisma.taxRate.upsert({
    where: { name: 'PPN 11%' },
    update: {},
    create: {
      name: 'PPN 11%',
      rate: 11.0,
      isActive: true,
      description: 'Pajak Pertambahan Nilai 11%',
    },
  });

  await prisma.taxRate.upsert({
    where: { name: 'NON_TAX' },
    update: {},
    create: {
      name: 'NON_TAX',
      rate: 0.0,
      isActive: true,
      description: 'No Tax applied',
    },
  });

  console.log('Master Data Bootstrapped successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
