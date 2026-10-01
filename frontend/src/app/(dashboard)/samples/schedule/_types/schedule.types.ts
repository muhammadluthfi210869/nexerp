export type ScheduleType = "MIXING" | "FILLING" | "PACKAGING";
export type ScheduleStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ProductionScheduleItem {
  id: string;
  scheduleCode: string;
  scheduleType: ScheduleType;
  scheduleTypeLabel: string;
  scheduleDate: string;
  batchRecordCode: string; // BR-202603-XXXX
  clientName: string;
  brandName: string;
  productName: string;
  targetQtyPcs: number;
  baseResultKg?: number;
  upscalePercent?: number;
  upscaleResultKg?: number;
  packagingMaterialName?: string;
  packagingQtyNeeded?: number;
  assignedLineOrMachine: string; // e.g. Bejana Homogenizer 500L, Line Filling 02
  picOperator: string;
  status: ScheduleStatus;
  statusLabel: string;
  notes?: string;
}

export interface CreateScheduleFormData {
  workOrderId: string;
  machineId: string;
  batchRecordCode: string;
  scheduleDate: string;
  targetQtyPcs: number;
  nettoPerPcs: number;
  upscalePercent: number;
  assignedMachine: string;
  picOperator: string;
  packagingName: string;
  notes: string;
}

export interface ScheduleKpiStats {
  totalSchedules: number;
  mixingCount: number;
  fillingCount: number;
  packagingCount: number;
}

export const mapToScheduleItem = (s: any): ProductionScheduleItem => {
  const type = s.stage === "FILLING" ? "FILLING" : (s.stage === "PACKAGING" || s.stage === "PACKING" ? "PACKAGING" : "MIXING");
  const typeLabel = type === "MIXING" ? "Jadwal Mixing Bejana" : (type === "FILLING" ? "Jadwal Filling Kemasan" : "Jadwal Packaging & Box");
  return {
    id: s.id,
    scheduleCode: `SCH-${type.slice(0, 3)}-${s.id.slice(0, 6).toUpperCase()}`,
    scheduleType: type,
    scheduleTypeLabel: typeLabel,
    scheduleDate: s.startTime ? new Date(s.startTime).toISOString().replace("T", " ").substring(0, 16) : "-",
    batchRecordCode: s.workOrder?.woNumber || `BR-${s.id.slice(0, 6)}`,
    clientName: s.workOrder?.lead?.clientName || "Klien Internal",
    brandName: s.workOrder?.lead?.brandName || "Brand",
    productName: s.workOrder?.productName || "Produk Kosmetik",
    targetQtyPcs: Number(s.targetQty) || 0,
    baseResultKg: Number(s.targetQty) ? Number(s.targetQty) / 1000 : 0,
    upscalePercent: Number(s.upscalePercent) || 0,
    assignedLineOrMachine: s.machine?.name || "Mesin Standar",
    picOperator: s.operatorName || "Operator Terjadwal",
    status: s.status || "SCHEDULED",
    statusLabel: s.status === "COMPLETED" ? "Selesai" : (s.status === "IN_PROGRESS" ? "Sedang Berjalan" : "Terjadwal"),
    notes: s.notes || "",
  };
};
