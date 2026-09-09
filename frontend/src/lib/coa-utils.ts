export interface CoaAccountItem {
  id?: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  normalBalance?: "DEBIT" | "CREDIT";
  category?: string;
  parentCode?: string;
  reportGroup?: string;
  isActive?: boolean;
}

export const MASTER_COA_LIST: CoaAccountItem[] = [
  // 1-XXXX ASSETS
  { code: "11100", name: "Kas Operasional", type: "ASSET", normalBalance: "DEBIT", category: "Kas & Bank" },
  { code: "11200", name: "Kas Kecil (Petty Cash)", type: "ASSET", normalBalance: "DEBIT", category: "Kas & Bank" },
  { code: "11300", name: "Bank BCA Operasional (541-xxx)", type: "ASSET", normalBalance: "DEBIT", category: "Kas & Bank" },
  { code: "11310", name: "Bank Mandiri Payroll (132-xxx)", type: "ASSET", normalBalance: "DEBIT", category: "Kas & Bank" },
  { code: "11400", name: "Piutang Usaha (Trade AR)", type: "ASSET", normalBalance: "DEBIT", category: "Piutang" },
  { code: "11410", name: "Uang Muka Pembelian (AP Down Payment)", type: "ASSET", normalBalance: "DEBIT", category: "Uang Muka" },
  { code: "11500", name: "Persediaan Bahan Baku (Raw Material)", type: "ASSET", normalBalance: "DEBIT", category: "Persediaan" },
  { code: "11510", name: "Persediaan Kemasan Primer (Primary Pkg)", type: "ASSET", normalBalance: "DEBIT", category: "Persediaan" },
  { code: "11520", name: "Persediaan Kemasan Sekunder (Secondary Pkg)", type: "ASSET", normalBalance: "DEBIT", category: "Persediaan" },
  { code: "11530", name: "Persediaan Bahan Pembantu & Kimia", type: "ASSET", normalBalance: "DEBIT", category: "Persediaan" },
  { code: "11540", name: "Persediaan Barang Jadi (Finished Goods)", type: "ASSET", normalBalance: "DEBIT", category: "Persediaan" },
  { code: "11550", name: "Persediaan Dalam Proses (WIP Mixing/Filling)", type: "ASSET", normalBalance: "DEBIT", category: "Persediaan" },
  { code: "11600", name: "PPN Masukan (Input VAT)", type: "ASSET", normalBalance: "DEBIT", category: "Pajak Dibayar Dimuka" },
  { code: "12100", name: "Aset Tetap - Mesin Pabrik", type: "ASSET", normalBalance: "DEBIT", category: "Aset Tetap" },
  { code: "12200", name: "Aset Tetap - Kendaraan Operasional", type: "ASSET", normalBalance: "DEBIT", category: "Aset Tetap" },
  { code: "12300", name: "Aset Tetap - Inventaris & Lab", type: "ASSET", normalBalance: "DEBIT", category: "Aset Tetap" },
  { code: "12900", name: "Akumulasi Penyusutan Aset Tetap", type: "ASSET", normalBalance: "CREDIT", category: "Aset Tetap" },

  // 2-XXXX LIABILITIES
  { code: "21100", name: "Hutang Usaha (Trade AP)", type: "LIABILITY", normalBalance: "CREDIT", category: "Hutang Lancar" },
  { code: "21200", name: "Uang Muka Penjualan (Customer DP)", type: "LIABILITY", normalBalance: "CREDIT", category: "Hutang Lancar" },
  { code: "21300", name: "Titipan Dana Klien (Client Escrow BPOM/HKI)", type: "LIABILITY", normalBalance: "CREDIT", category: "Hutang Lancar" },
  { code: "21400", name: "Hutang Gaji & Upah Tenaga Kerja", type: "LIABILITY", normalBalance: "CREDIT", category: "Hutang Lancar" },
  { code: "21500", name: "PPN Keluaran (Output VAT)", type: "LIABILITY", normalBalance: "CREDIT", category: "Hutang Pajak" },
  { code: "21510", name: "Hutang PPh 23 / PPh 21", type: "LIABILITY", normalBalance: "CREDIT", category: "Hutang Pajak" },

  // 3-XXXX EQUITY
  { code: "31100", name: "Modal Disetor", type: "EQUITY", normalBalance: "CREDIT", category: "Ekuitas" },
  { code: "32100", name: "Laba Ditahan (Retained Earnings)", type: "EQUITY", normalBalance: "CREDIT", category: "Ekuitas" },
  { code: "33100", name: "Laba Periode Berjalan", type: "EQUITY", normalBalance: "CREDIT", category: "Ekuitas" },

  // 4-XXXX REVENUE
  { code: "41100", name: "Pendapatan Jasa Maklon (Toll Mfg)", type: "REVENUE", normalBalance: "CREDIT", category: "Pendapatan Operasional" },
  { code: "41200", name: "Pendapatan Penjualan Produk (Full Buyout)", type: "REVENUE", normalBalance: "CREDIT", category: "Pendapatan Operasional" },
  { code: "41300", name: "Pendapatan Sample Fee", type: "REVENUE", normalBalance: "CREDIT", category: "Pendapatan Operasional" },
  { code: "42100", name: "Retur & Diskon Penjualan", type: "REVENUE", normalBalance: "DEBIT", category: "Pengurang Pendapatan" },

  // 5-XXXX COGS (Harga Pokok Penjualan)
  { code: "51100", name: "Beban Bahan Baku Terpakai", type: "EXPENSE", normalBalance: "DEBIT", category: "Harga Pokok Penjualan" },
  { code: "51200", name: "Beban Bahan Kemas Terpakai", type: "EXPENSE", normalBalance: "DEBIT", category: "Harga Pokok Penjualan" },
  { code: "51300", name: "Upah Langsung Lantai Produksi", type: "EXPENSE", normalBalance: "DEBIT", category: "Harga Pokok Penjualan" },
  { code: "51400", name: "Biaya Overhead Pabrik (Listrik & Mesin)", type: "EXPENSE", normalBalance: "DEBIT", category: "Harga Pokok Penjualan" },
  { code: "51500", name: "Beban Kualitas & Cacat (COPQ)", type: "EXPENSE", normalBalance: "DEBIT", category: "Harga Pokok Penjualan" },

  // 6-XXXX OPERATING EXPENSES
  { code: "61100", name: "Gaji & Tunjangan Karyawan", type: "EXPENSE", normalBalance: "DEBIT", category: "Beban Operasional" },
  { code: "61200", name: "Beban Pemasaran & Daily Ads", type: "EXPENSE", normalBalance: "DEBIT", category: "Beban Operasional" },
  { code: "61300", name: "Beban Riset & Lab R&D", type: "EXPENSE", normalBalance: "DEBIT", category: "Beban Operasional" },
  { code: "61400", name: "Beban Perjalanan Dinas & BusDev", type: "EXPENSE", normalBalance: "DEBIT", category: "Beban Operasional" },
  { code: "61500", name: "Beban Penyusutan Aset Tetap", type: "EXPENSE", normalBalance: "DEBIT", category: "Beban Operasional" },
  { code: "61600", name: "Beban Amortisasi Sertifikasi Legal", type: "EXPENSE", normalBalance: "DEBIT", category: "Beban Operasional" },
];

export function getCoaByCode(code: string): CoaAccountItem | undefined {
  return MASTER_COA_LIST.find((a) => a.code === code);
}

export function filterCoaByType(types: string | string[]): CoaAccountItem[] {
  const allowed = Array.isArray(types) ? types : [types];
  return MASTER_COA_LIST.filter((a) => allowed.includes(a.type));
}
