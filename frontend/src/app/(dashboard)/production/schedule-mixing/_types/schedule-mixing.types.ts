export type ScheduleMixingStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ScheduleMixingItem {
  id: string;
  code: string;
  date: string;
  batchRecord: string;
  salesOrder: string;
  customer: string;
  product: string;
  targetPcs: number;
  upscalePercent: number;
  upscaleResult: number;
  unit: string;
  status: ScheduleMixingStatus;
  notes?: string;
}

export interface ScheduleMixingFormData {
  code: string;
  date: string;
  batchRecord: string;
  customer: string;
  product: string;
  targetPcs: number;
  nettoPerPcs: number;
  upscalePercent: number;
  notes: string;
}

export interface ScheduleMixingKpiData {
  totalSchedules: number;
  totalScheduled: number;
  totalCompleted: number;
}
