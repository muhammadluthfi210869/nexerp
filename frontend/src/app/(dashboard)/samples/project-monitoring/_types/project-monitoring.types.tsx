export interface RndProject {
  id: string;
  projectName: string;
  picFormulator: string;
  clientName: string;
  brandName: string;
  status: "PENDING" | "IN_PROGRESS" | "TERKIRIM" | "OVERDUE" | "APPROVED" | "REVISION";
  statusLabel: string;
  npfEntryDate: string;
  targetFinishDate: string;
  shippingDate?: string;
  sampleWorkDays: number;
  formulaFolderUrl: string;
  notes: string;
  activeRevision: string;
}

export interface CreateProjectForm {
  leadId: string;
  projectName: string;
  picFormulator: string;
  clientName: string;
  brandName: string;
  npfEntryDate: string;
  targetFinishDate: string;
  formulaFolderUrl: string;
  notes: string;
}

export interface LeadOption {
  id: string | number;
  clientName?: string;
  companyName?: string;
  brandName?: string;
  [key: string]: any;
}

export type ProjectTabType = "all" | "progress" | "shipped" | "approved" | "overdue";

export const mapSampleToProject = (s: any): RndProject => {
  let status: RndProject["status"] = "IN_PROGRESS";
  let statusLabel = "In Progress";
  if (s.stage === "APPROVED") {
    status = "APPROVED";
    statusLabel = "Sample Disetujui";
  } else if (s.stage === "REVISING" || s.stage === "FEEDBACK_RECEIVED") {
    status = "REVISION";
    statusLabel = "Revisi Sample";
  } else if (s.stage === "SENT_TO_CLIENT") {
    status = "TERKIRIM";
    statusLabel = "Sample Terkirim";
  } else if (s.stage === "QUEUE" || s.stage === "WAITING_FINANCE") {
    status = "PENDING";
    statusLabel = "Menunggu Antrian";
  } else if (s.targetDeadline && new Date(s.targetDeadline) < new Date() && s.stage !== "APPROVED") {
    status = "OVERDUE";
    statusLabel = "Overdue";
  }

  const createdDate = s.createdAt ? new Date(s.createdAt) : new Date();
  const workDays = Math.max(1, Math.round((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    id: s.id,
    projectName: s.productName || "Formula R&D",
    picFormulator: s.pic?.fullName || s.pic?.name || "Belum Ditugaskan",
    clientName: s.lead?.clientName || s.lead?.companyName || "Klien Mandiri",
    brandName: s.lead?.brandName || "Brand",
    status,
    statusLabel,
    npfEntryDate: s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : "-",
    targetFinishDate: s.targetDeadline ? new Date(s.targetDeadline).toISOString().split("T")[0] : "-",
    shippingDate: s.sentToClientAt ? new Date(s.sentToClientAt).toISOString().split("T")[0] : undefined,
    sampleWorkDays: workDays,
    formulaFolderUrl: s.formulaFolderUrl || `https://drive.google.com/drive/folders/rnd-${s.sampleCode || s.id}`,
    notes: s.targetFunction || s.feedbackNotes || s.textureReq || "Parameter spesifikasi lab aktif.",
    activeRevision: s.formulas?.[0] ? `Rev ${s.formulas[0].version}` : `Rev ${s.revisionCount || 1}`,
  };
};
