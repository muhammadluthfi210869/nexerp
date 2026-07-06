
import { PrismaClient, AccountType, NormalBalance, PeriodStatus, ReportGroup } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 SEEDING FINANCE E2E DATA...');

  // 1. Create Financial Period for current month
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const periodName = `FY${year}-${month}`;
  const startDate = new Date(year, now.getMonth(), 1);
  const endDate = new Date(year, now.getMonth() + 1, 0);

  console.log(`📅 Creating Financial Period: ${periodName}...`);
  await prisma.financialPeriod.upsert({
    where: { name: periodName },
    update: {},
    create: {
      name: periodName,
      startDate,
      endDate,
      status: PeriodStatus.OPEN,
    },
  });

  // 2. Upsert 20 Chart of Accounts
  console.log('📊 Ensuring 20 COA accounts...');
  const accounts = [
    { code: '1101', name: 'Kas Kecil', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1110', name: 'Bank BCA (Operasional)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1111', name: 'Bank Mandiri (Penerimaan)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1201', name: 'Piutang Usaha', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1301', name: 'Persediaan Bahan Baku', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1402', name: 'Biaya Dibayar Dimuka / Uang Muka', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1501', name: 'Aset Tetap', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.FIXED_ASSET },
    { code: '2101', name: 'Hutang Usaha / Supplier', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY },
    { code: '2201', name: 'Hutang Pajak', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY },
    { code: '2300', name: 'Pendapatan Diterima Dimuka', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY },
    { code: '2301', name: 'DP Produksi Klien', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY },
    { code: '3100', name: 'Modal Disetor', type: AccountType.EQUITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.EQUITY },
    { code: '4101', name: 'Pendapatan Penjualan Maklon', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OPERATING_REVENUE },
    { code: '4102', name: 'Pendapatan Sampel', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OPERATING_REVENUE },
    { code: '5100', name: 'HPP Produksi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS },
    { code: '6101', name: 'Beban Iklan & Promosi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX },
    { code: '6201', name: 'Beban Gaji', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX },
    { code: '6202', name: 'Beban Kantor', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX },
    { code: '7100', name: 'Pendapatan Lain-lain', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OTHER_REVENUE },
    { code: '8100', name: 'Beban Lain-lain', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OTHER_EXPENSE },
  ];

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: {},
      create: acc,
    });
  }
  console.log(`  ✅ ${accounts.length} COA accounts upserted.`);

  // 3. Create dummy Supplier for E2E tests
  console.log('🏭 Creating E2E Supplier...');
  await prisma.supplier.upsert({
    where: { id: 'e2e00000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: 'e2e00000-0000-4000-8000-000000000001',
      name: 'E2E Test Supplier',
      contact: 'e2e@test-supplier.com',
      phone: '021-12345678',
      email: 'e2e@test-supplier.com',
      performanceScore: 5.0,
    },
  });
  console.log('  ✅ E2E Supplier created.');

  console.log('✅ FINANCE E2E SEED COMPLETED.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
