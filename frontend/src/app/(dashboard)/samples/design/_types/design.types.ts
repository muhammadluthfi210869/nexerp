export interface DesignTaskVersion {
  id: string;
  versionNumber: number;
  artworkUrl: string | null;
  mockupUrl: string | null;
}

export interface DesignLead {
  id: string;
  clientName: string;
  brandName: string | null;
  productInterest: string | null;
}

export interface DesignTask {
  id: string;
  brief: string;
  taskType: string | null;
  kanbanState: string;
  revisionCount: number;
  isLocked: boolean;
  isFinal: boolean;
  slaDeadline: string | null;
  finalArtworkUrl: string | null;
  finalMockupUrl: string | null;
  createdAt: string;
  updatedAt: string;
  lead: DesignLead | null;
  versions: DesignTaskVersion[];
}

export interface AvailableSalesOrder {
  id: string;
  orderNumber: string;
  leadId: string;
  brandName: string | null;
  lead: { clientName: string; brandName: string | null } | null;
}

export const KANBAN_STATES = [
  "INBOX",
  "IN_PROGRESS",
  "WAITING_APJ",
  "WAITING_CLIENT",
  "REVISION",
  "LOCKED",
] as const;

export type KanbanState = (typeof KANBAN_STATES)[number];

export const STATE_LABEL: Record<string, string> = {
  INBOX: "Inbox",
  IN_PROGRESS: "Dikerjakan",
  WAITING_APJ: "Menunggu APJ",
  WAITING_CLIENT: "Menunggu Klien",
  REVISION: "Revisi",
  LOCKED: "Locked / Siap Cetak",
};

export const STATE_VARIANT: Record<
  string,
  "neutral" | "info" | "warning" | "critical" | "success" | "purple"
> = {
  INBOX: "neutral",
  IN_PROGRESS: "info",
  WAITING_APJ: "purple",
  WAITING_CLIENT: "warning",
  REVISION: "critical",
  LOCKED: "success",
};

export const TASK_TYPES = ["PACKAGING", "PRINTING", "LABEL", "OTHER"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export interface DesignFormData {
  soId: string;
  brief: string;
  taskType: TaskType;
}

export interface DesignKpiStats {
  totalBerjalan: number;
  menungguApproval: number;
  disetujui: number;
  perluRevisi: number;
}

export function formatDate(value?: string | null): string {
  if (!value) return "â€”";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "â€”";
  return d.toISOString().slice(0, 10);
}

export function unwrapList(payload: any): any[] {
  const list = payload?.data?.data || payload?.data || payload;
  if (Array.isArray(list)) return list;
  if (Array.isArray(list?.data)) return list.data;
  return [];
}
