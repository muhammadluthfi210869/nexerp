/**
 * Unified Enterprise Document Sequence Generator & Reference Engine
 * 
 * Mencegah human error (manual typing invoice/voucher/PO/SO/BMR) dengan auto-generated
 * format berurutan standar ISO-Date YYYYMM-XXXX.
 */

export type DocumentPrefix =
  | "PR"       // Purchase Request
  | "PO"       // Purchase Order
  | "DP-PO"    // Down Payment Purchase
  | "BILL"     // Faktur Pembelian
  | "RET-PO"   // Retur Pembelian
  | "SO"       // Sales Order
  | "SMP"      // Sample Request
  | "DP-SO"    // Down Payment Sales
  | "INV"      // Faktur Penjualan
  | "KWT"      // Kwitansi / Bayar Penjualan
  | "RET-SO"   // Retur Penjualan
  | "GRN"      // Goods Receipt Note
  | "SJ-DO"    // Surat Jalan / Delivery Order
  | "TRF"      // Transfer Antar Gudang
  | "ADJ"      // Adjustment Stok
  | "OPN"      // Stock Opname
  | "JV"       // Journal Voucher
  | "BKM"      // Bukti Kas Masuk
  | "BKK"      // Bukti Kas Keluar
  | "REC"      // Rekonsiliasi Bank
  | "FR"       // Fund Request / Petty Cash
  | "AST"      // Fixed Asset
  | "SPK"      // Surat Perintah Kerja Produksi
  | "BMR"      // Batch Manufacturing Record
  | "MR"       // Material Requisition
  | "FORM"     // Formulasi R&D
  | "NPF"      // New Product Form
  | "QAR"      // Karantina QC
  | "LAB"      // Uji Lab QC
  | "COA-REL"  // Otorisasi APJ Rilis QC
  | "IPQC";    // In-Process QC

/**
 * Menghasilkan nomor dokumen otomatis berbasis prefix, periode tahun-bulan, dan sequence acak/berurutan
 */
export function generateAutoDocNumber(prefix: DocumentPrefix, seedIndex?: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const period = `${year}${month}`;
  
  if (seedIndex !== undefined) {
    const seq = String(seedIndex).padStart(4, "0");
    return `${prefix}-${period}-${seq}`;
  }
  
  // Random running seed for draft creation (e.g. 0001 - 9999)
  const randomSeq = String(Math.floor(1000 + Math.random() * 9000)).substring(0, 4);
  return `${prefix}-${period}-${randomSeq}`;
}

/**
 * Helper untuk format tanggal hari ini default (YYYY-MM-DD)
 */
export function getTodayIsoDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Helper untuk kalkulasi jatuh tempo default (H+N hari)
 */
export function getDefaultDueDate(daysAhead: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split("T")[0];
}
