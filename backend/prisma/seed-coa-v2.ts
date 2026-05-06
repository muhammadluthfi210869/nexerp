// @ts-nocheck
import { PrismaClient, AccountType, NormalBalance } from '@prisma/client';
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
  console.log('Seeding Chart of Accounts (CoA) V2...');

  const coa = [
    // 1. ASET (1000)
    { code: '1100', name: 'Kas & Bank (Aset Lancar)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1101', name: 'Kas Kecil (Petty Cash) Pabrik', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1110', name: 'Bank BCA (Operasional)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1111', name: 'Bank Mandiri (Penerimaan Klien)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1200', name: 'Piutang (Tagihan ke Pihak Luar)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1201', name: 'Piutang Usaha / Klien Maklon', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1202', name: 'Piutang Karyawan (Kasbon)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1300', name: 'Persediaan (Inventory)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1301', name: 'Persediaan Bahan Baku', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1302', name: 'Persediaan Kemasan', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1303', name: 'Persediaan Barang Dalam Proses (WIP)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1304', name: 'Persediaan Barang Jadi (FG)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1400', name: 'Aset Pajak & Uang Muka', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1401', name: 'PPN Masukan (Input Tax)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1402', name: 'Uang Muka Pembelian (Advance)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'CURRENT_ASSET' },
    { code: '1500', name: 'Aset Tetap (Fixed Assets)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'FIXED_ASSET' },
    { code: '1501', name: 'Mesin Pabrik', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: 'FIXED_ASSET' },
    { code: '1502', name: 'Akumulasi Penyusutan Mesin', type: AccountType.ASSET, normalBalance: NormalBalance.CREDIT, reportGroup: 'FIXED_ASSET' },

    // 2. KEWAJIBAN (2000)
    { code: '2100', name: 'Kewajiban Jangka Pendek', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: 'CURRENT_LIABILITY' },
    { code: '2101', name: 'Hutang Usaha / Supplier', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: 'CURRENT_LIABILITY' },
    { code: '2102', name: 'Hutang Gaji Karyawan', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: 'CURRENT_LIABILITY' },
    { code: '2200', name: 'Kewajiban Pajak', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: 'CURRENT_LIABILITY' },
    { code: '2201', name: 'PPN Keluaran (Output Tax)', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: 'CURRENT_LIABILITY' },
    { code: '2202', name: 'Hutang PPh (21, 23, dll)', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: 'CURRENT_LIABILITY' },
    { code: '2300', name: 'Pendapatan Diterima Di Muka', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: 'CURRENT_LIABILITY' },
    { code: '2301', name: 'DP Produksi Klien', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: 'CURRENT_LIABILITY' },

    // 3. EKUITAS (3000)
    { code: '3100', name: 'Modal Saham / Disetor', type: AccountType.EQUITY, normalBalance: NormalBalance.CREDIT, reportGroup: 'EQUITY' },
    { code: '3200', name: 'Laba Ditahan', type: AccountType.EQUITY, normalBalance: NormalBalance.CREDIT, reportGroup: 'EQUITY' },
    { code: '3300', name: 'Laba Tahun Berjalan', type: AccountType.EQUITY, normalBalance: NormalBalance.CREDIT, reportGroup: 'EQUITY' },

    // 4. PENDAPATAN (4000)
    { code: '4100', name: 'Pendapatan Operasional', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: 'OPERATING_REVENUE' },
    { code: '4101', name: 'Pendapatan Penjualan Maklon', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: 'OPERATING_REVENUE' },
    { code: '4102', name: 'Pendapatan Pembuatan Sampel', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: 'OPERATING_REVENUE' },
    { code: '4103', name: 'Pendapatan Jasa Legalitas', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: 'OPERATING_REVENUE' },

    // 5. HPP (5000)
    { code: '5100', name: 'Biaya Produksi Langsung', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'COGS' },
    { code: '5101', name: 'HPP Bahan Baku Kimia Terpakai', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'COGS' },
    { code: '5102', name: 'HPP Kemasan Terpakai', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'COGS' },
    { code: '5103', name: 'Biaya Tenaga Kerja Langsung', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'COGS' },
    { code: '5200', name: 'Biaya Overhead Pabrik (BOP)', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'COGS' },
    { code: '5201', name: 'Penyusutan Mesin Produksi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'COGS' },
    { code: '5202', name: 'Listrik Pabrik & Air RO', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'COGS' },

    // 6. BEBAN OPERASIONAL (6000)
    { code: '6100', name: 'Beban Penjualan & Pemasaran', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'OPEX' },
    { code: '6101', name: 'Beban Iklan (Meta/TikTok)', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'OPEX' },
    { code: '6102', name: 'Komisi BusDev / Sales', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'OPEX' },
    { code: '6200', name: 'Beban Umum & Administrasi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'OPEX' },
    { code: '6201', name: 'Gaji Karyawan Tetap', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'OPEX' },
    { code: '6202', name: 'Beban Listrik & Internet Kantor', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'OPEX' },
    { code: '6203', name: 'Beban Konsumsi & ATK', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'OPEX' },
    { code: '6204', name: 'Beban Pemeliharaan Software', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'OPEX' },

    // 7. LAIN-LAIN (7000/8000)
    { code: '7100', name: 'Pendapatan Lain-lain', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: 'OTHER_REVENUE' },
    { code: '8100', name: 'Beban Lain-lain', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: 'OTHER_EXPENSE' },
  ];

  for (const item of coa) {
    await prisma.account.upsert({
      where: { code: item.code },
      update: item,
      create: item,
    });
  }

  console.log('CoA Seeding Completed.');
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
