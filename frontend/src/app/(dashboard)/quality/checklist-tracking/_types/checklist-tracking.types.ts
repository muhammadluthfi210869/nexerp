export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "DELAYED" | "HOLD";
export type ProjectOverallStatus = "ON_TRACK" | "PENDING" | "DELAYED" | "COMPLETED";

export type IpqcStatus = "PASSED" | "DEVIATION" | "HOLD" | "IN_PROGRESS" | "VERIFIED";

export interface ChecklistAuditPoint {
  id: string;
  pointNumber: number;
  description: string;
  sopRef: string;
  standard: string;
  actual: string;
  status: "passed" | "failed" | "pending";
  notes?: string;
}

export interface IpqcChecklistTracking {
  id: string;
  qcControlNo: string;
  dateTime: string;
  spkBatchNo: string;
  productionLine: string;
  processStage: string;
  inspectorName: string;
  verifiedChecklistItems: string;
  deviationFindings: string;
  ipqcStatus: IpqcStatus;
  totalItems: number;
  passedItems: number;
  failedItems: number;
  duration?: string;
  verifiedBy?: string;
  category?: string;
  name?: string;
  auditPoints?: ChecklistAuditPoint[];
  code?: string;
  completedAt?: string;
  pic?: string;
  status?: string;
}

export type ChecklistTracking = IpqcChecklistTracking;

export interface ProjectMilestone {
  id: string;
  category: string;
  pic: string;
  department: "Busdev" | "Design" | "R&D" | "Legalitas" | "SCM" | "Produksi" | "QC" | "Finance" | "Logistik";
  days: number;
  startDate: string; // Tanggal Mulai SLA
  endDate: string; // Tanggal Selesai SLA
  deadlineDate: string; // Target Deadline per PIC (Poin 96 & 97)
  estimationDate: string; // Estimasi Tanggal Selesai (Poin 98 & 160)
  dependsOn: string;
  status: MilestoneStatus;
  notes: string; // Catatan Wajib saat status Pending (Poin 123 & 161)
  updatedAt: string;
}

export interface ProjectChecklistTrackingItem {
  id: string;
  soId?: string;
  soCode: string;
  customerName: string;
  brandName: string;
  productName: string;
  busdevPic: string;
  orderDate: string;
  deadlineFinal: string;
  daysRemaining: number;
  progressPct: number;
  completedCount: number;
  totalCount: number;
  currentStage: string;
  overallStatus: ProjectOverallStatus;
  milestones: ProjectMilestone[];
}

export const MILESTONE_DEFINITIONS: Array<{
  category: string;
  defaultPic: string;
  department: ProjectMilestone["department"];
  days: number;
  dependsOn: string;
  isAutoDoneFromBusdev?: boolean;
}> = [
  { category: "Desain Logo", defaultPic: "Edi Design", department: "Design", days: 1, dependsOn: "Mulai langsung" },
  { category: "HKI", defaultPic: "Nur Kholilah", department: "Legalitas", days: 1, dependsOn: "Mulai langsung" },
  { category: "Busdev Order & Berkas", defaultPic: "Fadilah Syahab", department: "Busdev", days: 1, dependsOn: "Mulai langsung", isAutoDoneFromBusdev: true },
  { category: "R&D Batch Record", defaultPic: "Tim R&D Formulator", department: "R&D", days: 1, dependsOn: "Setelah Busdev Order" },
  { category: "BPOM Merk", defaultPic: "Admin Legalitas", department: "Legalitas", days: 1, dependsOn: "Mulai langsung" },
  { category: "BPOM NA", defaultPic: "Nur Kholilah", department: "Legalitas", days: 14, dependsOn: "Setelah R&D Formula" },
  { category: "MOU", defaultPic: "Diaz Muhammad Irsyadi", department: "Busdev", days: 1, dependsOn: "Mulai langsung", isAutoDoneFromBusdev: true },
  { category: "Desain Kemasan", defaultPic: "Edi Design", department: "Design", days: 9, dependsOn: "Mulai langsung" },
  { category: "Approval Desain", defaultPic: "Laksmi Diah Ahmada", department: "Design", days: 1, dependsOn: "Setelah Desain Kemasan" },
  { category: "Bahan Baku", defaultPic: "Achmad Bagir", department: "SCM", days: 11, dependsOn: "Mulai langsung" },
  { category: "Pelunasan", defaultPic: "Diaz Muhammad Irsyadi", department: "Finance", days: 59, dependsOn: "Mulai langsung" },
  { category: "Mixing", defaultPic: "Muhammad Ruhullah", department: "Produksi", days: 2, dependsOn: "Setelah Bahan Baku & Kemas" },
  { category: "Bahan Kemas", defaultPic: "Eunike Putriningtyas", department: "SCM", days: 11, dependsOn: "Mulai langsung" },
  { category: "Filling", defaultPic: "Muhammad Ruhullah", department: "Produksi", days: 2, dependsOn: "Setelah Mixing" },
  { category: "Label", defaultPic: "Eunike Putriningtyas", department: "SCM", days: 6, dependsOn: "Mulai langsung" },
  { category: "Box", defaultPic: "Eunike Putriningtyas", department: "SCM", days: 24, dependsOn: "Mulai langsung" },
  { category: "Packing", defaultPic: "Rudy Affandy", department: "Produksi", days: 4, dependsOn: "Setelah Filling & Box" },
  { category: "Delivery", defaultPic: "Muhammad Ghufron", department: "Logistik", days: 2, dependsOn: "Setelah Packing & QC" },
  { category: "Halal", defaultPic: "Fatimah Amira", department: "QC", days: 2, dependsOn: "Mulai langsung" },
  { category: "Uji Lab", defaultPic: "Ciptaning", department: "QC", days: 2, dependsOn: "Setelah Mixing / IPC" },
];

export function generateProjectMilestones(
  orderDate: string,
  deadlineFinal: string,
  busdevName: string
): ProjectMilestone[] {
  const start = new Date(orderDate || new Date());
  let runningDate = new Date(start);

  return MILESTONE_DEFINITIONS.map((def, idx) => {
    const isAutoDone = def.isAutoDoneFromBusdev ?? false;
    const mStartDate = new Date(runningDate);
    const mEndDate = new Date(runningDate);
    mEndDate.setDate(mEndDate.getDate() + def.days);

    // advance running date slightly for chronological dependencies
    if (idx % 3 === 0) {
      runningDate.setDate(runningDate.getDate() + 2);
    }

    const pic = def.isAutoDoneFromBusdev && busdevName ? busdevName : def.defaultPic;
    const startStr = mStartDate.toISOString().slice(0, 10);
    const endStr = mEndDate.toISOString().slice(0, 10);

    return {
      id: `m-${idx + 1}`,
      category: def.category,
      pic: pic,
      department: def.department,
      days: def.days,
      startDate: startStr,
      endDate: endStr,
      deadlineDate: endStr,
      estimationDate: isAutoDone ? "Selesai saat input" : `Estimasi ${endStr}`,
      dependsOn: def.dependsOn,
      status: isAutoDone ? "DONE" : "PENDING",
      notes: isAutoDone ? "Input Busdev otomatis terverifikasi" : "-",
      updatedAt: new Date().toLocaleString("id-ID"),
    };
  });
}
