/** A field the backend does not send is shown as unknown, never guessed. */
export const UNKNOWN = "â€”";

// â”€â”€ Backend contracts â”€â”€
// GET /qc/checklists â†’ QCChecklist + { progress, creator }. `salesOrderId` is a
// bare scalar (qc.prisma declares no `salesOrder` relation and findAll includes
// only `creator`), so there is NO SO number, client name or brand in the payload.
export interface ChecklistItem {
  id: string;
  title: string;
  salesOrderId: string | null;
  workOrderId: string | null;
  status: string;
  items: { label: string; isRequired?: boolean }[];
  completedItems: string[];
  notes: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  creator?: { id?: string; fullName?: string };
}

// GET /qc/checklists/categories â†’ { id, label, order, gate }. Read-only: the
// controller exposes no POST/PATCH/DELETE for categories.
export interface ChecklistCategory {
  id: string;
  label: string;
  order: number;
  gate: string;
}

export type ChecklistActiveTab = "checklist" | "category" | "manage";

export interface NewChecklistForm {
  title: string;
  workOrderId: string;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return UNKNOWN;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return UNKNOWN;
  return d.toLocaleDateString("id-ID");
}

export function percent(completed: number, total: number): number {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}
