import type { ApprovalDetailData } from "@/components/dna";

export type ApiFormulaPhase = {
  prefix: string;
  order: number;
  items: Array<{
    id: string;
    dosagePercentage: string | number;
    costSnapshot: string | number | null;
    material: { code: string | null; name: string } | null;
  }>;
};

export type ApiSample = {
  id: string;
  sampleCode: string;
  productName: string;
  targetFunction: string;
  textureReq: string;
  colorReq: string;
  aromaReq: string;
  stage: string;
  requestedAt: string;
  targetDeadline: string | null;
  feedback: string | null;
  rejectionReason: string | null;
  pic: { fullName: string } | null;
  lead: {
    clientName: string | null;
    brandName: string | null;
    pic: { fullName: string } | null;
  } | null;
  formulas: Array<{ version: number; phases: ApiFormulaPhase[] }>;
};

export type SalesSampleApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SalesSampleLineItem {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
}

export interface SalesSampleApprovalItem {
  id: string;
  code: string;
  client: string;
  brand: string;
  productName: string;
  targetFunction: string;
  formulator: string;
  revision: string;
  salesPic: string;
  date: string;
  dueDate: string;
  status: SalesSampleApprovalStatus;
  notes: string;
  lineItems: SalesSampleLineItem[];
}

export const EMPTY = "â€”";

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
};

/** The canonical sample stage mapped onto the approval shell's three states. */
export const approvalStatusOf = (stage: string): SalesSampleApprovalStatus => {
  if (stage === "APPROVED") return "APPROVED";
  if (stage === "REJECTED" || stage === "CANCELLED") return "REJECTED";
  return "PENDING";
};

export const toItem = (sample: ApiSample): SalesSampleApprovalItem => {
  const formula = sample.formulas?.[0];
  const lineItems = (formula?.phases ?? [])
    .flatMap((phase) => phase.items ?? [])
    .map((item) => ({
      id: item.id,
      itemCode: item.material?.code ?? EMPTY,
      itemName: item.material?.name ?? "Material belum tertaut",
      qty: Number(item.dosagePercentage) || 0,
      unit: "%",
    }));

  return {
    id: sample.id,
    code: sample.sampleCode,
    client: sample.lead?.clientName ?? EMPTY,
    brand: sample.lead?.brandName ?? EMPTY,
    productName: sample.productName,
    targetFunction: sample.targetFunction,
    formulator: sample.pic?.fullName ?? EMPTY,
    revision: formula ? `V${formula.version}` : EMPTY,
    salesPic: sample.lead?.pic?.fullName ?? EMPTY,
    date: formatDate(sample.requestedAt),
    dueDate: formatDate(sample.targetDeadline),
    status: approvalStatusOf(sample.stage),
    notes: sample.rejectionReason || sample.feedback || "",
    lineItems,
  };
};

export const buildDetailData = (item: SalesSampleApprovalItem): ApprovalDetailData => ({
  id: item.id,
  code: item.code,
  title: `Persetujuan Sample Lab: ${item.productName}`,
  category: "SAMPLE R&D DAN FORMULASI",
  status: item.status,
  date: item.date,
  dueDate: item.dueDate,
  creatorName: item.formulator,
  creatorRole: "R&D Formulator",
  requesterName: item.salesPic,
  partnerName: item.client,
  partnerLabel: "Klien Pemesan (Brand Owner)",
  notes: `Target Fungsi: ${item.targetFunction}${item.notes ? ` | Catatan: ${item.notes}` : ""}`,
  lineItems: item.lineItems.map((li) => ({ ...li, unitPrice: 0, total: 0 })),
});
