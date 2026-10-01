/**
 * Types and Constants for Target Penjualan & Kategori Penjualan
 * Master Kelola Penjualan
 */

export interface SalesTargetItem {
  id: string;
  userId: string;
  marketingName: string;
  marketingEmail: string;
  marketingRole: string;
  month: number;
  year: number;
  nominalTarget: number;
  realizedRevenue: number;
  achievementPercent: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesCategoryItem {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineStage {
  step: number;
  title: string;
  duration: string;
  desc: string;
}

export interface MarketingUser {
  id: string;
  fullName?: string;
  email?: string;
  roles?: string[];
  [key: string]: any;
}

export const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const DEFAULT_TIMELINE_STAGES: TimelineStage[] = [
  { step: 1, title: "Registrasi Lead & Kebutuhan Maklon", duration: "1-2 Hari", desc: "Input kontak, target produk, dan estimasi omzet" },
  { step: 2, title: "Formulasi RnD & Pengujian Sampel", duration: "7-14 Hari", desc: "Pembuatan formula sampel kosmetik di lab RnD" },
  { step: 3, title: "Penawaran Harga HPP & Negosiasi", duration: "3-5 Hari", desc: "Penerbitan surat penawaran harga resmi maklon" },
  { step: 4, title: "Penerbitan SPK & Kontrak Maklon", duration: "2-3 Hari", desc: "Penandatanganan SPK dan perjanjian kerja sama" },
  { step: 5, title: "Pembayaran DP Faktur Penjualan (50%)", duration: "1-3 Hari", desc: "Verifikasi kas/bank masuk untuk down payment" },
  { step: 6, title: "Produksi Mixing, Filling & Packaging", duration: "14-21 Hari", desc: "Pelaksanaan proses produksi di pabrik bersertifikasi" },
  { step: 7, title: "Pelunasan Sisa & Pengiriman (DO)", duration: "1-2 Hari", desc: "Pelunasan invoice dan penerbitan surat jalan gudang" },
];
