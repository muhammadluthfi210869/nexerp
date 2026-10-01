export type QcReleaseBatchStatus =
  | "QUARANTINE"
  | "INVESTIGATION"
  | "RELEASED"
  | "REJECTED";

export interface QcReleaseBatchItem {
  id: string;
  certificateNo?: string;
  coaNumber?: string;
  releaseDate?: string;
  batchNumber: string;
  spkCode: string;
  customerName: string;
  brandName: string;
  productName: string;
  bpomNie?: string;
  category: string;
  outputQty: number;
  completionDate: string;
  organolepticPass: boolean;
  phValue: number;
  phRange: string;
  viscosityCps: number;
  microbiologyPass: boolean;
  microbiologyResult: string;
  specificGravity: number;
  status: QcReleaseBatchStatus;
  apjName?: string;
  apjSipa?: string;
  signatureHash?: string;
  notes?: string;
}

export interface StatusConfigItem {
  label: string;
  badge: "default" | "warning" | "success" | "critical";
}

export const STATUS_CONFIG: Record<string, StatusConfigItem> = {
  QUARANTINE: { label: "Karantina APJ", badge: "warning" },
  INVESTIGATION: { label: "Inkubasi Mikro", badge: "default" },
  RELEASED: { label: "Rilis Resmi WH-03", badge: "success" },
  REJECTED: { label: "Reject Mutu", badge: "critical" },
};
