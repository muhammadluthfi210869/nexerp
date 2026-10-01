import React from "react";
import { FlaskConical, Zap, Package } from "lucide-react";

export type ScheduleStage = "MIXING" | "FILLING" | "PACKAGING";
export type ScheduleStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";
export type ScheduleViewMode = "TABLE" | "GANTT";

export interface ProductionScheduleItem {
  id: string;
  code: string;
  spkCode: string;
  startDate: string;
  endDate: string;
  soNumber: string;
  customerName: string;
  brandName: string;
  productName: string;
  targetQty: number;
  unit: string;
  stage: ScheduleStage;
  status: ScheduleStatus;
  machineName: string;
  operator: string;
  progressPct: number;
  notes: string;
}

export interface ScheduleKpis {
  totalActive: number;
  mixingCount: number;
  fillingCount: number;
  packingCount: number;
}

export interface StageConfigItem {
  label: string;
  badge: "info" | "purple" | "warning";
  icon: React.ComponentType<{ className?: string }>;
}

export const STAGE_CONFIG: Record<string, StageConfigItem> = {
  MIXING: { label: "Mixing", badge: "info", icon: FlaskConical },
  FILLING: { label: "Filling", badge: "purple", icon: Zap },
  PACKAGING: { label: "Packaging", badge: "warning", icon: Package },
};

export const STATUS_CONFIG: Record<ScheduleStatus, { label: string; badge: "default" | "warning" | "info" | "success" | "danger" }> = {
  SCHEDULED: { label: "Terjadwal", badge: "info" },
  IN_PROGRESS: { label: "Berjalan", badge: "warning" },
  COMPLETED: { label: "Selesai", badge: "success" },
  DELAYED: { label: "Tertunda", badge: "danger" },
};

export const mapToItem = (s: any, idx: number): ProductionScheduleItem => ({
  id: s.id || `sch-${idx + 1}`,
  code: s.scheduleCode || `SCH-${s.stage?.slice(0, 3) || "PRD"}-${String(idx + 1).padStart(3, "0")}`,
  spkCode: s.workOrder?.woNumber || s.spkCode || `SPK/2026/03/${String(idx + 1).padStart(3, "0")}`,
  startDate: s.startTime ? s.startTime.slice(0, 10) : (s.startDate || new Date().toISOString().slice(0, 10)),
  endDate: s.endTime ? s.endTime.slice(0, 10) : (s.endDate || new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)),
  soNumber: s.workOrder?.salesOrder?.soNumber || s.workOrder?.soNumber || s.soNumber || `SO/2026/03/${String(idx + 101).padStart(3, "0")}`,
  customerName: s.workOrder?.lead?.clientName || s.customerName || "PT Kosmetika Alami",
  brandName: s.workOrder?.lead?.brandName || s.brandName || "Aura Glow",
  productName: s.workOrder?.productName || s.productName || "Brightening Facial Serum 30ml",
  targetQty: Number(s.targetQty) || 5000,
  unit: s.unit || (s.stage === "MIXING" ? "Kg" : "Pcs"),
  stage: (s.stage === "FILLING" ? "FILLING" : (s.stage === "PACKAGING" || s.stage === "PACKING" ? "PACKAGING" : "MIXING")),
  status: (s.status as ScheduleStatus) || "SCHEDULED",
  machineName: s.machine?.name || s.machineName || "Homogenizer Vessel 500L",
  operator: s.operatorName || s.operator || "Hendra Wijaya",
  progressPct: s.progressPct ?? (s.status === "COMPLETED" ? 100 : (s.status === "IN_PROGRESS" ? 50 : 0)),
  notes: s.notes || "",
});
