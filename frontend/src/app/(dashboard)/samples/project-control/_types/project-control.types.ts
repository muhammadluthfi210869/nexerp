/**
 * Domain types and constants for Project Control Dashboard.
 */

export interface ProjectRow {
  id: string;
  projectCode: string;
  name: string;
  channel: string;
  category: string;
  status: string;
  progress: number;
  startDate: string | null;
  deadline: string | null;
  summary: string | null;
  blockers: string | null;
  taskCount: number;
  ownerName: string;
  brandName: string | null;
  updatedAt: string;
}

export interface ProjectControlSummary {
  totalActive: number;
  onTrack: number;
  atRisk: number;
  onHold: number;
  planned: number;
  completed: number;
  blocked: number;
  avgProgress: number;
}

export const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Direncanakan",
  ON_TRACK: "On Track",
  AT_RISK: "At Risk",
  ON_HOLD: "Ditahan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const STATUS_FILTERS = [
  "ALL",
  "PLANNED",
  "ON_TRACK",
  "AT_RISK",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;

export type StatusFilter = (typeof STATUS_FILTERS)[number];

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
