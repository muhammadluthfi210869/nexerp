export type CogsRequestView = "list" | "form";

export interface CogsRequestItem {
  id?: string;
  kode?: string;
  code?: string;
  jobOrderNumber?: string;
  pelanggan?: string;
  customer?: string;
  description?: string;
  produk?: string;
  product?: string;
  formula?: string;
  formulaCode?: string;
  cost?: number;
  totalCost?: number;
  totalRevenue?: number;
  status?: string;
  closedAt?: string | null;
  tanggal?: string;
  recordedAt?: string;
  [key: string]: any;
}

export interface CogsSampleRecord {
  name?: string;
  netto?: string;
  formula?: string;
  revision?: string;
  [key: string]: any;
}

export type CogsSampleMap = Record<string, CogsSampleRecord>;

export interface CogsRequestKpis {
  activeCount: number;
  closedCount: number;
  totalRecords: number;
  filteredCount: number;
}
