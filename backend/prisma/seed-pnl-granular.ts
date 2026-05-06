// @ts-nocheck
import { PrismaClient, AccountType, NormalBalance, ReportGroup } from '@prisma/client';
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
  console.log('🚀 Seeding Comprehensive Profit & Loss COA...');

  const categories = [
    // --- REVENUE ---
    { code: '4000', name: 'OPERATING REVENUE', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OPERATING_REVENUE },
    { code: '4100', name: 'PENJUALAN', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OPERATING_REVENUE, parentCode: '4000' },
    { code: '4101', name: 'Penjualan Kosmetik', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OPERATING_REVENUE, parentCode: '4100' },
    { code: '4102', name: 'Penjualan Sampel', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OPERATING_REVENUE, parentCode: '4100' },
    { code: '4103', name: 'Pendapatan Ongkir', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OPERATING_REVENUE, parentCode: '4100' },
    { code: '4200', name: 'RETUR DAN POTONGAN PENJUALAN', type: AccountType.REVENUE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPERATING_REVENUE, parentCode: '4000' },
    { code: '4201', name: 'Retur Penjualan', type: AccountType.REVENUE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPERATING_REVENUE, parentCode: '4200' },
    { code: '4202', name: 'Potongan Penjualan', type: AccountType.REVENUE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPERATING_REVENUE, parentCode: '4200' },

    // --- COGS ---
    { code: '5000', name: 'COST OF GOODS SOLD', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS },
    { code: '5100', name: 'HARGA POKOK PENJUALAN', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5000' },
    { code: '5101', name: 'Harga Pokok Barang Jadi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5102', name: 'Harga Pokok Bahan Baku', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5103', name: 'Harga Pokok Bahan Pembantu', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5104', name: 'Pemakaian Bahan Baku', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5105', name: 'Pemakaian Bahan Pembantu', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5106', name: 'Tenaga Kerja Pabrik', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5107', name: 'Listrik Pabrik', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5108', name: 'Air Pabrik', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5109', name: 'Beban Peny Bangunan Pabrik', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5110', name: 'Beban Peny Inventaris Pabrik', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5111', name: 'Beban Peny Mesin dan Peralatan Pabrik', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5112', name: 'Overhead Pabrik Lain', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5113', name: 'Variance', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5114', name: 'Koreksi Stock', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5115', name: 'Beban Laboratorium', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5116', name: 'Koreksi Stock Retur Rusak', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5117', name: 'Beban Import', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5118', name: 'Harga Pokok Sample Kosmetik', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },
    { code: '5119', name: 'Beban Proofing Packing', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, parentCode: '5100' },

    // --- OPERATING EXPENSES ---
    { code: '6000', name: 'OPERATING EXPENSES', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX },
    { code: '6100', name: 'BEBAN PENJUALAN', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6000' },
    { code: '6101', name: 'Beban Komisi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6100' },
    { code: '6102', name: 'Beban Pendaftaran BPOM', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6100' },
    { code: '6103', name: 'Beban Pendaftaran Merk', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6100' },
    { code: '6104', name: 'Beban Digital Marketing', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6100' },
    { code: '6105', name: 'Beban Iklan Promosi Penjualan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6100' },
    { code: '6106', name: 'Beban Angkut', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6100' },
    { code: '6107', name: 'Beban Pameran', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6100' },
    { code: '6108', name: 'Beban Penelitian & Pengembangan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6100' },
    { code: '6109', name: 'Beban Pendaftaran HSA', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6100' },
    { code: '6110', name: 'Beban Pembuatan Video', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6100' },
    { code: '6111', name: 'Beban Bensin & Solar Gudang', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6100' },
    { code: '6112', name: 'Beban Perjalanan Dinas Luar Kota', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6100' },
    { code: '6113', name: 'Beban Perjalanan Dinas Luar Pulau', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6100' },
    { code: '6114', name: 'Beban Penghapusan Piutang', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6100' },

    { code: '6200', name: 'BEBAN UMUM DAN ADMINISTRASI', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6000' },
    { code: '6201', name: 'Beban Gaji', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6202', name: 'Beban Lembur', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6203', name: 'Beban Insentif Karyawan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6204', name: 'Beban Bonus & Gratifikasi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6205', name: 'Beban THR', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6206', name: 'Beban Jamsostek /Astek', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6207', name: 'Beban Honorarium', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6208', name: 'Beban Tunjangan Makan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6209', name: 'Beban Tunjangan Pengobatan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6210', name: 'Beban Tunjangan Transportasi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6211', name: 'Beban Tunjangan Perumahan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6212', name: 'Beban Kenikmatan Lainnya', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6213', name: 'Beban Honor Manajemen', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6214', name: 'Beban Honor Tenaga Ahli Lainnya', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6215', name: 'Beban Pos dan Materai', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6216', name: 'Beban Perijinan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6217', name: 'Beban Retribusi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6218', name: 'Beban Jamuan Entertaint', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6219', name: 'Beban Sumbangan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6220', name: 'Beban Listrik', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6221', name: 'Beban Air', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6222', name: 'Beban Gas Negara/LPG', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6223', name: 'Beban Telp, Fax dan Internet', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6224', name: 'Beban Bensin & Solar', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6225', name: 'Beban Pengiriman Surat & Paket', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6226', name: 'Beban Stationery', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6227', name: 'Beban Pendidikan dan Seminar', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6228', name: 'Beban Rapat', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6229', name: 'Beban Asuransi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6230', name: 'Beban Admin Bank', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6231', name: 'Beban Provisi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6232', name: 'Beban Sewa Kendaraan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6233', name: 'Beban Amortisasi Sewa', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6234', name: 'Beban Pajak', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6235', name: 'Beban Gedung', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6236', name: 'Beban Kendaraan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6237', name: 'Beban Spare Part (Non PPh 23)', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6238', name: 'Beban Peny Bangunan Kantor', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6239', name: 'Beban Peny Inventaris Kantor', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6240', name: 'Beban Penyusutan Kendaraan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6241', name: 'Beban PBB', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6242', name: 'Beban Perbaikan Inventaris', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6243', name: 'Beban Pajak B3', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6244', name: 'Beban Sewa', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6245', name: 'Beban PPh 21', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6246', name: 'Beban Direksi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6247', name: 'Beban Tenaga Kerja Outsoursing', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },
    { code: '6248', name: 'Beban Pinjam Pakai', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, parentCode: '6200' },

    // --- OTHER INCOME & EXPENSES ---
    { code: '7000', name: 'OTHER INCOME', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OTHER_REVENUE },
    { code: '7100', name: 'PENDAPATAN DILUAR USAHA', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OTHER_REVENUE, parentCode: '7000' },
    { code: '7101', name: 'Pendapatan Jasa Giro', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OTHER_REVENUE, parentCode: '7100' },
    { code: '7102', name: 'Penjualan Aktiva', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OTHER_REVENUE, parentCode: '7100' },
    { code: '7103', name: 'Pendapatan Lain-Lain', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OTHER_REVENUE, parentCode: '7100' },
    { code: '7104', name: 'Potongan Pembayaran', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OTHER_REVENUE, parentCode: '7100' },

    { code: '8000', name: 'OTHER EXPENSES', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OTHER_EXPENSE },
    { code: '8100', name: 'BIAYA DILUAR USAHA', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OTHER_EXPENSE, parentCode: '8000' },
    { code: '8101', name: 'Kurang lebih Bayar', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OTHER_EXPENSE, parentCode: '8100' },
    { code: '8102', name: 'Pajak Jasa Giro', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OTHER_EXPENSE, parentCode: '8100' },
    { code: '8103', name: 'Beban Bunga Bank', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OTHER_EXPENSE, parentCode: '8100' },
    { code: '8104', name: 'Beban Bunga Pihak Ketiga', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OTHER_EXPENSE, parentCode: '8100' },
    { code: '8105', name: 'Beban Selisih Kurs', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OTHER_EXPENSE, parentCode: '8100' },
    { code: '8106', name: 'Beban Lainnya', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OTHER_EXPENSE, parentCode: '8100' },
    { code: '8107', name: 'Beban Selisih Tagihan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OTHER_EXPENSE, parentCode: '8100' },
    { code: '8108', name: 'Beban Supplies', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OTHER_EXPENSE, parentCode: '8100' },

    { code: '8200', name: 'BEBAN PAJAK PENGHASILAN', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OTHER_EXPENSE, parentCode: '8000' },
    { code: '8201', name: 'Beban Pajak Penghasilan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OTHER_EXPENSE, parentCode: '8200' },
  ];

  // 1. Create all accounts without parents first to get their IDs
  console.log('Step 1: Upserting accounts...');
  for (const item of categories) {
    const { parentCode, ...data } = item;
    await prisma.account.upsert({
      where: { code: item.code },
      update: { ...data, parentId: null }, // Reset parent temporarily
      create: { ...data },
    });
  }

  // 2. Link parents
  console.log('Step 2: Linking hierarchical relationships...');
  for (const item of categories) {
    if (item.parentCode) {
      const parent = await prisma.account.findUnique({ where: { code: item.parentCode } });
      if (parent) {
        await prisma.account.update({
          where: { code: item.code },
          data: { parentId: parent.id },
        });
      }
    }
  }

  console.log('✅ Comprehensive P&L COA Seeding Completed.');
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
