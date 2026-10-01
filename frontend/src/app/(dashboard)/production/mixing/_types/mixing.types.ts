export type MixingStatus = "MENUNGGU" | "PROSES" | "PENDING" | "SELESAI" | "DIBATALKAN";

export interface MixingHistoryLog {
  timestamp: string;
  note: string;
  operator: string;
}

export interface MixingProductionItem {
  id: string;
  scheduleCode: string;
  date: string;
  batchRecord: string;
  salesOrder: string;
  customer: string;
  category: string;
  product: string;
  formulaName: string;
  targetPcs: number;
  nettoGram: number;
  baseResultKg: number;
  upscalePct: number;
  upscaleResultKg: number;
  actualMixingKg?: number;
  status: MixingStatus;
  notes?: string;
  historyLogs?: MixingHistoryLog[];
}

export interface MixingKpis {
  total: number;
  proses: number;
  pending: number;
  selesai: number;
}
