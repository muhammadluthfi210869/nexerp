export const EMPTY = "â€”";

export interface DesignVersionRow {
  id: string;
  versionNumber: number;
  artworkUrl?: string | null;
  mockupUrl?: string | null;
  createdAt?: string;
}

export interface DesignTaskRow {
  id: string;
  brief: string;
  taskType?: string | null;
  kanbanState: string;
  revisionCount: number;
  isLocked: boolean;
  isFinal: boolean;
  slaDeadline?: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: {
    id: string;
    clientName?: string | null;
    brandName?: string | null;
    productInterest?: string | null;
  } | null;
  versions: DesignVersionRow[];
}

export interface DesignFeedbackItem {
  id: string;
  fromDivision?: string | null;
  author?: {
    fullName?: string | null;
  } | null;
  version?: {
    versionNumber?: number | null;
  } | null;
  createdAt?: string | null;
  approvalStatus?: string | null;
  content?: string | null;
}

export interface DesignTaskHistoryResponse {
  allowanceLeft?: number;
  revisionBound?: number | string;
  history?: DesignFeedbackItem[];
}

export type DrawerTab = "detail" | "bpom" | "protocol";
export type DecisionStatus = "APPROVED" | "REJECTED";

export const KANBAN_LABEL: Record<string, string> = {
  INBOX: "ANTREAN BARU",
  IN_PROGRESS: "DIKERJAKAN DESAINER",
  WAITING_APJ: "MENUNGGU REVIEW APJ",
  WAITING_CLIENT: "MENUNGGU ACC KLIEN",
  REVISION: "REVISI",
  LOCKED: "FINAL / TERKUNCI",
};

export const KANBAN_VARIANT: Record<string, "info" | "warning" | "critical" | "success" | "neutral"> = {
  INBOX: "neutral",
  IN_PROGRESS: "info",
  WAITING_APJ: "warning",
  WAITING_CLIENT: "warning",
  REVISION: "critical",
  LOCKED: "success",
};

export function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function latestVersionOf(task: DesignTaskRow): DesignVersionRow | undefined {
  if (!Array.isArray(task.versions) || task.versions.length === 0) return undefined;
  return [...task.versions].sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0))[0];
}
