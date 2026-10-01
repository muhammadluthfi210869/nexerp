export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export const EMPTY = "â€”";

export interface PurchaseApprovalLineItem {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  tax?: number;
  total: number;
  notes?: string;
}

export interface PurchaseApprovalItem {
  id: string;
  code: string;
  supplier: string;
  warehouse: string;
  itemsCount: number;
  totalAmount: number;
  paymentTerm: string;
  requesterName: string;
  creatorRole: string;
  // Aliases read by ApprovalPageShell's search and stat aggregation.
  title: string;
  partnerName: string;
  date: string;
  dueDate: string;
  status: ApprovalStatus;
  notes: string;
  lineItems: PurchaseApprovalLineItem[];
}

export interface RejectPurchasePayload {
  id: string;
  reason: string;
}

/** POStatus â†’ the shell/modal vocabulary. */
export function approvalStatusOf(status?: string): ApprovalStatus {
  const key = (status || "").toUpperCase();
  if (key === "REJECTED" || key === "CANCELLED" || key === "RETURNED") return "REJECTED";
  if (key === "DRAFT" || key === "PENDING" || key === "PENDING_APPROVAL") return "PENDING";
  if (key === "APPROVED") return "APPROVED";
  // ORDERED / PARTIAL / SHIPPED / RECEIVED / CLOSED â€” already past approval.
  return key ? "APPROVED" : "PENDING";
}

export function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function toItem(raw: any): PurchaseApprovalItem {
  const items: any[] = Array.isArray(raw?.items) ? raw.items : [];
  const lineItems = items.map((li: any, idx: number) => {
    const qty = Number(li?.quantity) || 0;
    const unitPrice = Number(li?.unitPrice) || 0;
    return {
      id: li?.id ?? `li-${idx}`,
      itemCode: li?.material?.code ?? EMPTY,
      itemName: li?.material?.name ?? "Material belum tertaut",
      qty,
      unit: li?.material?.unit ?? EMPTY,
      unitPrice,
      total: Number(li?.totalPrice) || qty * unitPrice,
    };
  });
  return {
    id: raw?.id,
    code: raw?.poNumber ?? EMPTY,
    supplier: raw?.supplier?.name ?? "Supplier belum tertaut",
    warehouse: raw?.purchaseRequest?.warehouse?.name ?? EMPTY,
    itemsCount: items.length,
    totalAmount: Number(raw?.totalValue) || 0,
    paymentTerm: raw?.supplier?.termOfPayment
      ? `${raw.supplier.termOfPayment} hari`
      : EMPTY,
    requesterName: raw?.scm?.fullName ?? EMPTY,
    creatorRole: "SCM Processor",
    title: raw?.notes ?? EMPTY,
    partnerName: raw?.supplier?.name ?? EMPTY,
    date: formatDate(raw?.createdAt),
    dueDate: formatDate(raw?.dueDate ?? raw?.estArrival),
    status: approvalStatusOf(raw?.status),
    notes: raw?.notes ?? EMPTY,
    lineItems,
  };
}
