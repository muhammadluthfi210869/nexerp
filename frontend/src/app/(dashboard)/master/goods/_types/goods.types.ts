export interface MasterBarangItem {
  id: string;
  kode: string;
  nama: string;
  supplierAsal: string;
  wujudFisik: string;
  realStok: number;
  stokMin: number;
  hargaBeli: number;
  kategori: string;
  categoryId?: string;
  subKategori: string;
  satuan: string;
  description?: string;
  imageUrl?: string;
  // Paritas G-SERP Pembelian Terakhir
  lastPoDate?: string | null;
  lastPoNumber?: string;
  lastSupplierName?: string;
  lastPoQty?: number;
  lastPoPrice?: number;
  // 8 Pemetaan Akun CoA
  coaMapping?: {
    coa_1?: string;
    coa_2?: string;
    coa_3?: string;
    coa_4?: string;
    coa_5?: string;
    coa_6?: string;
    coa_7?: string;
    coa_8?: string;
  };
  inventoryAccount?: { id: string; code: string; name: string };
  salesAccount?: { id: string; code: string; name: string };
}

export interface KategoriBarangItem {
  id: string;
  code: string;
  name: string;
  description: string;
  type: string;
  _count?: { materials?: number };
}

export interface PurchaseHistoryItem {
  id: string;
  poNumber: string;
  tanggal: string;
  supplierName: string;
  qty: number;
  harga: number;
  total: number;
  status: string;
}

export interface AccountOptionItem {
  id: string;
  code: string;
  name: string;
  label: string;
}

export interface BarangFormData {
  kode: string;
  nama: string;
  categoryId?: string;
  kategori: string;
  subKategori: string;
  satuan: string;
  hargaBeli: number;
  hargaJual?: number;
  stokMin?: number;
  minimumStock?: number;
  leadTimeDays?: number;
  deskripsi?: string;
  description?: string;
  imageUrl?: string;
  wujudFisik?: string;
  accountPersediaan?: string;
  accountHpp?: string;
  status?: "ACTIVE" | "INACTIVE";
  coa_1?: string;
  coa_2?: string;
  coa_3?: string;
  coa_4?: string;
  coa_5?: string;
  coa_6?: string;
  coa_7?: string;
  coa_8?: string;
}

export interface CategoryFormData {
  code: string;
  name: string;
  description: string;
}
