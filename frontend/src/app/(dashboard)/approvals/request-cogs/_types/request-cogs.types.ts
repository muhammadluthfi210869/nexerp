export const EMPTY = "â€”";

export interface CogsApprovalItem {
  id: string;
  code: string;
  description: string;
  totalCost: number;
  totalRevenue: number;
  // Aliases read by ApprovalPageShell's search and stat aggregation.
  title: string;
  totalAmount: number;
  marginPercent: number;
  date: string;
  closedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string;
}

export function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function toItem(raw: any): CogsApprovalItem {
  const cost = Number(raw?.totalCost) || 0;
  const revenue = Number(raw?.totalRevenue) || 0;
  const closed = Boolean(raw?.closedAt);
  return {
    id: raw?.id,
    code: raw?.jobOrderNumber ?? EMPTY,
    description: raw?.description ?? EMPTY,
    totalCost: cost,
    totalRevenue: revenue,
    marginPercent: revenue > 0 ? Math.round(((revenue - cost) / revenue) * 1000) / 10 : 0,
    date: formatDate(raw?.recordedAt),
    closedAt: formatDate(raw?.closedAt),
    // The model has no rejection state: an open costing is awaiting review, a closed
    // one has been signed off. Nothing is labelled REJECTED because nothing can be.
    status: closed ? "APPROVED" : "PENDING",
    title: raw?.description ?? EMPTY,
    totalAmount: cost,
    notes: raw?.description ?? EMPTY,
  };
}
