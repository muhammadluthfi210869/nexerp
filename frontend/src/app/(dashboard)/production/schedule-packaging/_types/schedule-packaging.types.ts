export type SchedulePackagingStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface SchedulePackagingItem {
  id: string;
  code: string;
  date: string;
  batchRecord: string;
  salesOrder: string;
  customer: string;
  product: string;
  targetPcs: number;
  secondaryPackaging: string;
  packagingQty: number;
  creator: string;
  status: SchedulePackagingStatus;
  notes?: string;
}

export interface SchedulePackagingFormData {
  code: string;
  date: string;
  batchRecord: string;
  customer: string;
  product: string;
  targetPcs: number;
  secondaryPackaging: string;
  packagingQty: number;
  notes: string;
}

export interface SchedulePackagingKpis {
  totalSchedules: number;
  totalScheduled: number;
  totalCompleted: number;
  complianceRate: string;
}
