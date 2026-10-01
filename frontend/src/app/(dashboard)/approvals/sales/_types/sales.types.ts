import type { ApprovalDetailData } from "@/components/dna";

export const EMPTY = "â€”";

export type SalesOrderStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SalesOrderLineItem {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface SalesOrderApprovalItem {
  id: string;
  code: string;
  customer: string;
  brand: string;
  itemsCount: number;
  quantity: number;
  totalAmount: number;
  dpStatus: string;
  salesPic: string;
  // Aliases read by ApprovalPageShell's search and stat aggregation.
  title: string;
  partnerName: string;
  date: string;
  dueDate: string;
  status: SalesOrderStatus;
  notes: string;
  lineItems: SalesOrderLineItem[];
}

/** SOStatus â†’ the shell/modal vocabulary. */
export function approvalStatusOf(status?: string): SalesOrderStatus {
  const key = (status || "").toUpperCase();
  if (key === "CANCELLED") return "REJECTED";
  if (key === "PENDING_DP" || key === "AMENDMENT_REVIEW") return "PENDING";
  return key ? "APPROVED" : "PENDING";
}

export function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function toItem(raw: any): SalesOrderApprovalItem {
  const rows: any[] = Array.isArray(raw?.items) ? raw.items : [];
  const lineItems: SalesOrderLineItem[] = rows.map((li: any, idx: number) => ({
    id: li?.id ?? `li-${idx}`,
    itemCode: EMPTY,
    itemName: li?.productName ?? "Produk belum tertaut",
    qty: Number(li?.quantity) || 0,
    unit: li?.netto ? `${Number(li.netto)} g` : EMPTY,
    unitPrice: Number(li?.unitPrice) || 0,
    total: Number(li?.subtotal) || 0,
  }));
  const invoices: any[] = Array.isArray(raw?.invoices) ? raw.invoices : [];
  const dp = invoices.find((inv) => String(inv?.type).toUpperCase() === "DP");
  return {
    id: raw?.id,
    code: raw?.orderNumber ?? EMPTY,
    customer: raw?.lead?.clientName ?? "Klien belum tertaut",
    brand: raw?.brandName ?? raw?.salesCategory ?? EMPTY,
    itemsCount: rows.length,
    quantity: Number(raw?.quantity) || 0,
    totalAmount: Number(raw?.totalAmount) || 0,
    dpStatus: dp ? (dp.status ?? EMPTY) : "BELUM ADA INVOICE DP",
    salesPic: EMPTY,
    title: raw?.amendmentReason ?? raw?.brandName ?? EMPTY,
    partnerName: raw?.lead?.clientName ?? EMPTY,
    date: formatDate(raw?.transactionDate ?? raw?.createdAt),
    dueDate: formatDate(raw?.dueDate),
    status: approvalStatusOf(raw?.status),
    notes: raw?.amendmentReason ?? EMPTY,
    lineItems,
  };
}

export function buildDetailData(item: SalesOrderApprovalItem): ApprovalDetailData {
  return {
    id: item.id,
    code: item.code,
    title: `Persetujuan Sales Order: ${item.customer} (${item.brand})`,
    category: "PENJUALAN PRODUK JADI",
    status: item.status,
    date: item.date,
    dueDate: item.dueDate,
    creatorName: item.customer,
    creatorRole: "Klien Maklon",
    partnerName: item.customer,
    partnerLabel: "Klien Maklon (Pelanggan)",
    totalAmount: item.totalAmount,
    notes: `Status Invoice DP: ${item.dpStatus}${item.notes !== EMPTY ? ` | ${item.notes}` : ""}`,
    lineItems: item.lineItems,
    timeline: [
      {
        id: "tl-1",
        action: "Sales order tercatat di sistem",
        actor: item.customer,
        role: "Commercial",
        timestamp: item.date,
        status: "completed",
      },
      {
        id: "tl-2",
        action: "Aktivasi sales order (interlock DP lunas)",
        actor: "Menunggu keputusan approver",
        role: "Management",
        timestamp: item.status === "PENDING" ? "Menunggu eksekusi" : item.date,
        status:
          item.status === "APPROVED"
            ? "completed"
            : item.status === "REJECTED"
            ? "failed"
            : "pending",
      },
    ],
  };
}
