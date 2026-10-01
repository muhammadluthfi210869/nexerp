export const EMPTY = "â€”";

export interface GoodsRequestApprovalItem {
  id: string;
  code: string;
  salesOrderId: string;
  // Aliases read by ApprovalPageShell's search.
  title: string;
  partnerName: string;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string;
}

/** GoodsRequirement.status is a free String column; the app writes APPROVED / COMPLETED. */
export function approvalStatusOf(status?: string): "PENDING" | "APPROVED" | "REJECTED" {
  const key = (status || "").toUpperCase();
  if (key === "APPROVED" || key === "COMPLETED" || key === "RELEASED") return "APPROVED";
  if (key === "REJECTED" || key === "CANCELLED") return "REJECTED";
  return "PENDING";
}

export function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function toItem(raw: any): GoodsRequestApprovalItem {
  return {
    id: raw?.id,
    code: raw?.code ?? EMPTY,
    salesOrderId: raw?.salesOrderId ?? EMPTY,
    title: raw?.notes ?? EMPTY,
    partnerName: raw?.salesOrderId ?? EMPTY,
    date: formatDate(raw?.date ?? raw?.createdAt),
    status: approvalStatusOf(raw?.status),
    notes: raw?.notes ?? EMPTY,
  };
}
