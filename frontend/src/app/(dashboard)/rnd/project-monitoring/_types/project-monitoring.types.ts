export interface RndProjectRecord {
  id: string;
  projectCode: string;
  clientName: string;
  brandName: string;
  productName: string;
  category: string;
  claim: string;
  picFormulator: string;
  currentPhase: "Formulasi Lab" | "Uji Stabilitas" | "Sample Client" | "Uji Khasiat" | "BPOM Notifikasi" | "Siap Produksi";
  stabilityTestStatus: "LOLOS (Aman)" | "SEDANG DIUJI (Oven 45Â°C)" | "REVISI VISKOSITAS";
  bpomStatus: "BELUM DIAJUKAN" | "SUBMITTED" | "TERBIT NIE";
  startDate: string;
  targetCompletion: string;
  progressPercent: number;
  testParameters: {
    ph: string;
    viscosity: string;
    centrifuge: string;
    organoleptic: string;
    microbiology: string;
  };
}

export interface CreateProjectFormData {
  leadId: string;
  productName: string;
  targetFunction: string;
  textureReq: string;
  colorReq: string;
  aromaReq: string;
  targetDeadline: string;
}

export interface LeadOption {
  id: string;
  clientName?: string;
  companyName?: string;
  brandName?: string;
  [key: string]: any;
}

export const mapSampleToRecord = (s: any): RndProjectRecord => {
  let currentPhase: RndProjectRecord["currentPhase"] = "Formulasi Lab";
  let stabilityTestStatus: RndProjectRecord["stabilityTestStatus"] = "SEDANG DIUJI (Oven 45Â°C)";
  let bpomStatus: RndProjectRecord["bpomStatus"] = "BELUM DIAJUKAN";
  let progress = 25;

  if (s.stage === "APPROVED") {
    currentPhase = "Siap Produksi";
    stabilityTestStatus = "LOLOS (Aman)";
    bpomStatus = "TERBIT NIE";
    progress = 100;
  } else if (s.stage === "SENT_TO_CLIENT" || s.stage === "FEEDBACK_RECEIVED") {
    currentPhase = "Sample Client";
    progress = 75;
  } else if (s.stage === "INTERNAL_REVIEW") {
    currentPhase = "Uji Stabilitas";
    progress = 50;
  }

  return {
    id: s.id,
    projectCode: s.sampleCode || `RND-${s.id.slice(0, 6)}`,
    clientName: s.lead?.clientName || s.lead?.companyName || "Klien Mandiri",
    brandName: s.lead?.brandName || "Brand",
    productName: s.productName,
    category: s.targetFunction || "Skincare",
    claim: s.targetFunction || "Formula Standar",
    picFormulator: s.pic?.fullName || s.pic?.name || "Belum Ditugaskan",
    currentPhase,
    stabilityTestStatus,
    bpomStatus,
    startDate: s.createdAt ? new Date(s.createdAt).toLocaleDateString("id-ID") : "-",
    targetCompletion: s.targetDeadline ? new Date(s.targetDeadline).toLocaleDateString("id-ID") : "-",
    progressPercent: progress,
    testParameters: {
      ph: s.formulas?.[0]?.qcparameter?.phTarget || "5.5 - 6.5",
      viscosity: s.formulas?.[0]?.qcparameter?.viscosityTarget || "Standard cPs",
      centrifuge: "3000 rpm 30 mnt (Stabil)",
      organoleptic: s.textureReq || "Sesuai Standar Lab",
      microbiology: "ALT < 10 CFU/g (Lolos BPOM)",
    },
  };
};
