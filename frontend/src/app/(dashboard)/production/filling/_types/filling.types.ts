export type FillingStatus = "MENUNGGU" | "PROSES" | "PENDING" | "SELESAI" | "DIBATALKAN";

export interface FillingDetailRow {
  id: string;
  productionCode: string;
  machine: string;
  qtyProduce: number;
  date: string;
  status: string;
}

export interface FillingHistoryLog {
  timestamp: string;
  note: string;
  operator: string;
}

export interface FillingProductionItem {
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
  status: FillingStatus;
  notes?: string;
  detailRows?: FillingDetailRow[];
  historyLogs?: FillingHistoryLog[];
}

export interface FillingKpis {
  total: number;
  proses: number;
  pending: number;
  selesai: number;
}
