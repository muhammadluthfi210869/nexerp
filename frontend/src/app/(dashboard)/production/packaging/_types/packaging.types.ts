export type PackagingStatus = "MENUNGGU" | "PROSES" | "PENDING" | "SELESAI" | "DIBATALKAN";

export interface PackagingProductionDetailRow {
  id: string;
  productionCode: string;
  machine: string;
  qtyProduce: number;
  date: string;
  status: string;
}

export interface PackagingProductionHistoryLog {
  timestamp: string;
  note: string;
  operator: string;
}

export interface PackagingProductionItem {
  id: string;
  code: string;
  date: string;
  batchRecord: string;
  salesOrder: string;
  customer: string;
  category: string;
  product: string;
  targetPcs: number;
  actualPcs?: number;
  rejectPcs?: number;
  machine: string;
  status: PackagingStatus;
  notes?: string;
  detailRows?: PackagingProductionDetailRow[];
  historyLogs?: PackagingProductionHistoryLog[];
}

export interface PackagingKpiStats {
  total: number;
  proses: number;
  pending: number;
  selesai: number;
}
