import type { ApprovalDetailData } from "@/components/dna";

export const EMPTY = "â€”";

export type SalesReturnStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SalesReturnLineItem {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  originalQty: number;
}

export interface SalesReturnApprovalItem {
  id: string;
  code: string;
  soNumber: string;
  customer: string;
  brand: string;
  // Aliases read by ApprovalPageShell's search.
  title: string;
  partnerName: string;
  rawStatus: string;
  itemCount: number;
  totalQty: number;
  warehouse: string;
  date: string;
  status: SalesReturnStatus;
  notes: string;
  lineItems: SalesReturnLineItem[];
}

/** Free-text returnStatus â†’ the shell/modal vocabulary. */
export function approvalStatusOf(status?: string): SalesReturnStatus {
  const key = (status || "").toUpperCase();
  if (key === "REJECTED" || key === "DITOLAK" || key === "CANCELLED") return "REJECTED";
  if (["APPROVED", "DISETUJUI", "COMPLETED", "SELESAI", "RECEIVED", "DITERIMA", "QC_PASSED"].includes(key))
    return "APPROVED";
  return "PENDING";
}

export function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function toItem(raw: any): SalesReturnApprovalItem {
  const rows: any[] = Array.isArray(raw?.items) ? raw.items : [];
  const lineItems: SalesReturnLineItem[] = rows.map((li: any, idx: number) => ({
    id: li?.id ?? `li-${idx}`,
    itemCode: li?.material?.code ?? EMPTY,
    itemName: li?.material?.name ?? "Material belum tertaut",
    qty: Number(li?.qtyReturned) || 0,
    unit: li?.material?.unit ?? EMPTY,
    originalQty: Number(li?.qtyOriginal) || 0,
  }));
  return {
    id: raw?.id,
    code: raw?.so?.orderNumber ? `RT-${raw.so.orderNumber}` : (raw?.id ?? "").slice(0, 8),
    soNumber: raw?.so?.orderNumber ?? EMPTY,
    customer: raw?.so?.lead?.clientName ?? "Klien belum tertaut",
    brand: raw?.so?.brandName ?? EMPTY,
    rawStatus: raw?.returnStatus ?? EMPTY,
    itemCount: rows.length,
    totalQty: lineItems.reduce((sum, li) => sum + li.qty, 0),
    warehouse: raw?.warehouse?.name ?? EMPTY,
    date: formatDate(raw?.returnDate ?? raw?.createdAt),
    title: `${raw?.so?.orderNumber ?? "SO belum tertaut"} â€” ${raw?.notes ?? EMPTY}`,
    partnerName: raw?.so?.lead?.clientName ?? EMPTY,
    status: approvalStatusOf(raw?.returnStatus),
    notes: raw?.notes ?? EMPTY,
    lineItems,
  };
}

export function buildDetailData(item: SalesReturnApprovalItem): ApprovalDetailData {
  return {
    id: item.id,
    code: item.code,
    title: `Retur Penjualan: ${item.customer} (${item.soNumber})`,
    category: "RETUR PENJUALAN KLIEN",
    status: item.status,
    date: item.date,
    // SalesReturn records no author, so no requester is claimed here.
    creatorName: EMPTY,
    creatorRole: "Commercial",
    partnerName: item.customer,
    partnerLabel: "Pelanggan Maklon",
    warehouseName: item.warehouse,
    notes: `${item.notes} | Status backend: ${item.rawStatus}`,
    lineItems: item.lineItems.map((li) => ({
      id: li.id,
      itemCode: li.itemCode,
      itemName: li.itemName,
      qty: li.qty,
      unit: li.unit,
      notes: `Qty asal: ${li.originalQty}`,
    })),
    timeline: [
      {
        id: "tl-1",
        action: "Klaim retur tercatat di sistem",
        actor: item.customer,
        role: "Commercial",
        timestamp: item.date,
        status: "completed",
      },
      {
        id: "tl-2",
        action: "Otorisasi retur penjualan",
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
