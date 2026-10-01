export type ScheduleFillingStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ScheduleFillingItem {
  id: string;
  code: string;
  date: string;
  batchRecord: string;
  salesOrder: string;
  customer: string;
  product: string;
  targetPcs: number;
  status: ScheduleFillingStatus;
  primaryPackaging: string;
  packagingQty: number;
  creator: string;
  notes?: string;
}

export interface ScheduleFillingFormData {
  code: string;
  date: string;
  batchRecord: string;
  customer: string;
  product: string;
  targetPcs: number;
  primaryPackaging: string;
  packagingQty: number;
  notes: string;
}

export interface ScheduleFillingKpis {
  totalSchedules: number;
  totalScheduled: number;
  totalCompleted: number;
  nozzlePrecision: string;
}
