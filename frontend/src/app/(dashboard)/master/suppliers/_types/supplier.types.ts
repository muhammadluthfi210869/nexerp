/**
 * Types for Master Supplier & Vendor Module
 * Strictly isolated for master/suppliers domain.
 */

export interface MasterSupplierItem {
  id: string;
  vendorCode: string;
  nama: string;
  pic: string;
  phone: string;
  email?: string;
  categoryId?: string;
  kategoriBahan: "Bahan Baku" | "Kemasan Primer" | "Kemasan Sekunder" | "Jasa Maklon" | "Bahan Pembantu" | string;
  kota: string;
  provinsi: string;
  alamatLengkap: string;
  pajakPersen: number;
  description?: string;
  isPkp: boolean;
  npwp?: string;
  paymentTerm: string;
  bankAccount: string;
  realStokSupplier: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface KategoriSupplierItem {
  id: string;
  kode: string;
  kategori: string;
  deskripsi: string;
  totalSupplier: number;
}

export interface SupplierFormData {
  vendorCode: string;
  nama: string;
  pic: string;
  phone: string;
  email: string;
  categoryId?: string;
  kategoriBahan: MasterSupplierItem["kategoriBahan"];
  provinsi: string;
  kota: string;
  alamatLengkap: string;
  pajakPersen: 11 | 0 | number;
  description?: string;
  isPkp: boolean;
  npwp: string;
  paymentTerm: string;
  bankAccount: string;
  realStokSupplier: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface SupplierCategoryFormData {
  kode: string;
  kategori: string;
  deskripsi: string;
}

export type SupplierKpiFilterType = "ALL" | "BBK" | "KEMASAN" | "PKP";
