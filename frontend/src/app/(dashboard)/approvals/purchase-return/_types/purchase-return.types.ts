import type { ApprovalDetailData } from "@/components/dna";

export const EMPTY = "â€”";

export type PurchaseReturnStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PurchaseReturnLineItem {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface PurchaseReturnItem {
  id: string;
  code: string;
  refInbound: string;
  supplier: string;
  warehouse: string;
  returnReason: string;
  debitNote: string;
  totalAmount: number;
  requesterName: string;
  creatorRole: string;
  // Aliases read by ApprovalPageShell's search and stat aggregation.
  title: string;
  partnerName: string;
  date: string;
  status: PurchaseReturnStatus;
  notes: string;
  lineItems: PurchaseReturnLineItem[];
}

/** PurchaseReturnStatus â†’ the shell/modal vocabulary. */
export function approvalStatusOf(status?: string): PurchaseReturnStatus {
  const key = (status || "").toUpperCase();
  if (key === "COMPLETED") return "APPROVED";
  if (key === "CANCELLED") return "REJECTED";
  return "PENDING";
}

export function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function toItem(raw: any): PurchaseReturnItem {
  const rows: any[] = Array.isArray(raw?.items) ? raw.items : [];
  const lineItems: PurchaseReturnLineItem[] = rows.map((li: any, idx: number) => ({
    id: li?.id ?? `li-${idx}`,
    itemCode: li?.material?.code ?? EMPTY,
    itemName: li?.material?.name ?? "Material belum tertaut",
    qty: Number(li?.quantity) || 0,
    unit: li?.material?.unit ?? EMPTY,
    unitPrice: Number(li?.unitPrice) || 0,
    total: Number(li?.totalPrice) || 0,
  }));
  return {
    id: raw?.id,
    code: raw?.returnNumber ?? EMPTY,
    refInbound: raw?.inboundId ? raw.inboundId.slice(0, 8) : EMPTY,
    supplier: raw?.supplier?.name ?? "Supplier belum tertaut",
    warehouse: raw?.warehouse?.name ?? EMPTY,
    returnReason: raw?.notes ?? EMPTY,
    debitNote: raw?.debitNoteNumber ?? EMPTY,
    totalAmount: Number(raw?.totalValue) || 0,
    requesterName: raw?.creator?.fullName ?? EMPTY,
    creatorRole: "Pembuat Retur",
    title: raw?.notes ?? EMPTY,
    partnerName: raw?.supplier?.name ?? EMPTY,
    date: formatDate(raw?.date ?? raw?.createdAt),
    status: approvalStatusOf(raw?.status),
    notes: raw?.notes ?? EMPTY,
    lineItems,
  };
}

export function buildDetailData(item: PurchaseReturnItem): ApprovalDetailData {
  return {
    id: item.id,
    code: item.code,
    title: `Retur Pembelian: ${item.supplier}`,
    category: "RETUR PEMBELIAN VENDOR",
    status: item.status,
    date: item.date,
    creatorName: item.requesterName,
    creatorRole: item.creatorRole,
    partnerName: item.supplier,
    partnerLabel: "Supplier Vendor",
    warehouseName: item.warehouse,
    totalAmount: item.totalAmount,
    notes: `Catatan: ${item.notes} | Nota Debit: ${item.debitNote}`,
    lineItems: item.lineItems,
    timeline: [
      {
        id: "tl-1",
        action: "Retur pembelian tercatat di sistem",
        actor: item.requesterName,
        role: item.creatorRole,
        timestamp: item.date,
        status: "completed",
      },
      {
        id: "tl-2",
        action: "Otorisasi retur pembelian (stok & nota debit)",
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
