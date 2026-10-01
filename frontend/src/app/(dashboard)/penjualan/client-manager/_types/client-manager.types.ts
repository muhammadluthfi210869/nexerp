/**
 * Types & Domain Interfaces for Client Manager Pipeline
 *
 * Source: /bussdev/leads/group/* & /bussdev/sales-orders
 */

export interface LeadActivityRow {
  id: string;
  activityType: string;
  notes: string;
  createdAt: string | null;
  amount: number | null;
}

export interface LeadSampleRow {
  id: string;
  sampleCode: string;
  productName: string;
  stage: string;
  revisionCount: number;
  shippedAt: string | null;
  targetDeadline: string | null;
  clientRating: number | null;
  clientComment: string | null;
}

export interface LeadRow {
  id: string;
  clientName: string;
  brandName: string;
  productInterest: string;
  contactInfo: string;
  email: string | null;
  source: string;
  estimatedValue: number;
  moq: number;
  planOmset: number;
  status: string;
  hkiMode: string;
  hkiProgress: string | null;
  logoRevision: number;
  isFormulaLocked: boolean;
  spkFileUrl: string | null;
  orderCount: number;
  province: string | null;
  city: string | null;
  district: string | null;
  addressDetail: string | null;
  notes: string | null;
  packagingSuggestion: string | null;
  designSuggestion: string | null;
  launchingPlan: string | null;
  targetMarket: string | null;
  convertedToProdAt: string | null;
  wonAt: string | null;
  lastStageAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  picName: string;
  latestSample: LeadSampleRow | null;
  latestActivity: LeadActivityRow | null;
}

export interface SalesOrderRow {
  id: string;
  orderNumber: string;
  leadId: string;
  totalAmount: number;
  quantity: number;
  status: string;
  transactionDate: string | null;
  dueDate: string | null;
  brandName: string | null;
}

export type GroupKey = "sample" | "production" | "ro";

// â”€â”€ Helpers â”€â”€
export function unwrapList(payload: any): any[] {
  const list = payload?.data?.data || payload?.data || payload;
  if (Array.isArray(list)) return list;
  if (Array.isArray(list?.data)) return list.data;
  return [];
}

export function formatDate(value?: string | null): string {
  if (!value) return "â€”";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "â€”";
  return d.toISOString().slice(0, 10);
}

export function formatRupiah(value: number): string {
  return `Rp ${Math.round(value || 0).toLocaleString("id-ID")}`;
}

export function formatJuta(value: number): string {
  return `Rp ${((value || 0) / 1000000).toFixed(1)} Jt`;
}

export function toNumber(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? (n as number) : 0;
}

export function mapLead(raw: any): LeadRow {
  const sample = raw?.sampleRequests?.[0];
  const activity = raw?.activities?.[0];
  return {
    id: raw?.id,
    clientName: raw?.clientName || "â€”",
    brandName: raw?.brandName || "â€”",
    productInterest: raw?.productInterest || "â€”",
    contactInfo: raw?.contactInfo || "â€”",
    email: raw?.email || null,
    source: raw?.source || "â€”",
    estimatedValue: toNumber(raw?.estimatedValue),
    moq: toNumber(raw?.moq),
    planOmset: toNumber(raw?.planOmset),
    status: raw?.status || "â€”",
    hkiMode: raw?.hkiMode || "â€”",
    hkiProgress: raw?.hkiProgress || null,
    logoRevision: toNumber(raw?.logoRevision),
    isFormulaLocked: Boolean(raw?.isFormulaLocked),
    spkFileUrl: raw?.spkFileUrl || null,
    orderCount: toNumber(raw?.orderCount),
    province: raw?.province || null,
    city: raw?.city || null,
    district: raw?.district || null,
    addressDetail: raw?.addressDetail || null,
    notes: raw?.notes || null,
    packagingSuggestion: raw?.packagingSuggestion || null,
    designSuggestion: raw?.designSuggestion || null,
    launchingPlan: raw?.launchingPlan || null,
    targetMarket: raw?.targetMarket || null,
    convertedToProdAt: raw?.convertedToProdAt || null,
    wonAt: raw?.wonAt || null,
    lastStageAt: raw?.lastStageAt || null,
    createdAt: raw?.createdAt || null,
    updatedAt: raw?.updatedAt || null,
    picName: raw?.pic?.name || "â€”",
    latestSample: sample
      ? {
          id: sample.id,
          sampleCode: sample.sampleCode || "â€”",
          productName: sample.productName || "â€”",
          stage: sample.stage || "â€”",
          revisionCount: toNumber(sample.revisionCount),
          shippedAt: sample.shippedAt || null,
          targetDeadline: sample.targetDeadline || null,
          clientRating: sample.clientRating ?? null,
          clientComment: sample.clientComment || null,
        }
      : null,
    latestActivity: activity
      ? {
          id: activity.id,
          activityType: activity.activityType || "â€”",
          notes: activity.notes || "â€”",
          createdAt: activity.createdAt || null,
          amount:
            activity.amount === null || activity.amount === undefined
              ? null
              : toNumber(activity.amount),
        }
      : null,
  };
}

export function mapSalesOrder(raw: any): SalesOrderRow {
  return {
    id: raw?.id,
    orderNumber: raw?.orderNumber || "â€”",
    leadId: raw?.leadId,
    totalAmount: toNumber(raw?.totalAmount),
    quantity: toNumber(raw?.quantity),
    status: raw?.status || "â€”",
    transactionDate: raw?.transactionDate || null,
    dueDate: raw?.dueDate || null,
    brandName: raw?.brandName || null,
  };
}

export const STAGE_LABEL: Record<string, string> = {
  WAITING_FINANCE: "Menunggu Finance",
  QUEUE: "Dalam Antrian",
  FORMULATING: "Formulasi",
  LAB_TEST: "Uji Lab",
  READY_TO_SHIP: "Siap Kirim",
  SHIPPED: "Terkirim",
  RECEIVED: "Diterima Klien",
  CLIENT_REVIEW: "Review Klien",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

export function stageVariant(stage: string): string {
  if (stage === "APPROVED") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (stage === "REJECTED" || stage === "CANCELLED") return "bg-rose-100 text-rose-800 border-rose-300";
  if (stage === "CLIENT_REVIEW") return "bg-blue-100 text-blue-800 border-blue-300";
  return "bg-amber-100 text-amber-800 border-amber-300";
}

export function leadStatusVariant(status: string): string {
  if (status === "WON_DEAL") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (status === "LOST" || status === "ABORTED") return "bg-rose-100 text-rose-800 border-rose-300";
  if (status === "READY_TO_SHIP" || status === "SAMPLE_APPROVED")
    return "bg-blue-100 text-blue-800 border-blue-300";
  return "bg-amber-100 text-amber-800 border-amber-300";
}
