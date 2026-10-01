/**
 * Types for Master Pelanggan / Customer Module
 * Strictly isolated for master/customers domain.
 */

export interface MasterCustomerItem {
  id: string;
  customerCode: string;
  nama: string;
  clientName?: string;
  brandName: string;
  brandCode?: string;
  pic: string;
  penginput: string;
  picId?: string;
  phone: string;
  email?: string;
  birthDate?: string;
  kategori: string;
  categoryId?: string;
  kota: string;
  provinsi: string;
  alamatLengkap: string;
  contractType: "Jasa Maklon" | "Jual Putus";
  nominalSoProduk: number;
  soSampleCount: number;
  soProdukCount: number;
  status: "ACTIVE" | "INACTIVE";
  sampleFeeTotal: number;
  sampleStatus: string;
  produksiBatchTotal: number;
  produksiStatus: string;
  legalitasBpom: "Terbit" | "Proses Verifikasi" | "Belum Diajukan";
  legalitasHalal: "Sertifikasi Aktif" | "Audit LPPOM" | "Belum";
  legalitasHki: "Terdaftar Resmi" | "Pemeriksaan Substantif" | "Belum";
  escrowDeposit: number;
  salesOrders?: any[];
  sampleRequests?: any[];
  registrations?: any[];
}

export interface CustomerCategoryItem {
  id: string;
  code: string;
  name: string;
  kategori?: string;
  description: string;
  deskripsi?: string;
  type?: string;
  totalClient?: number;
  _count?: { salesLeads?: number };
}

export interface CustomerFormData {
  customerCode: string;
  nama: string;
  brandName: string;
  pic: string;
  phone: string;
  email: string;
  birthDate?: string;
  kategori: string;
  categoryId?: string;
  penginput: string;
  salesAssignee?: string;
  kota: string;
  provinsi: string;
  alamatLengkap: string;
  nominalSoProduk: number;
  escrowDeposit: number;
  legalitasBpom: MasterCustomerItem["legalitasBpom"];
  legalitasHalal: MasterCustomerItem["legalitasHalal"];
  legalitasHki: MasterCustomerItem["legalitasHki"];
  contractType: "Jasa Maklon" | "Jual Putus";
  status: "ACTIVE" | "INACTIVE";
  soSampleCount?: number;
  soProdukCount?: number;
  sampleFeeTotal?: number;
  sampleStatus?: string;
  produksiBatchTotal?: number;
  produksiStatus?: string;
}

export interface CustomerCategoryFormData {
  code: string;
  name: string;
  description: string;
}

export type CustomerKpiFilterType = "ALL" | "RO" | "LEADS" | "SAMPLE" | "PRODUKSI" | "ESCROW";
