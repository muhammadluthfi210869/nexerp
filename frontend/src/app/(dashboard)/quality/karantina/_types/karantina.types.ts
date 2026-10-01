export type QuarantineDefectCategory =
  | "KEMASAN"
  | "FISIK"
  | "KIMIA"
  | "MIKROBIOLOGI"
  | "LABEL_DOKUMEN";

export type QuarantineDispositionStatus =
  | "QUARANTINE"
  | "DISPOSAL"
  | "REWORK"
  | "RETURN_TO_VENDOR"
  | "RELEASED";

export type CoaVerificationStatus =
  | "TERVERIFIKASI"
  | "MENUNGGU"
  | "TIDAK_SESUAI";

export interface QuarantineItem {
  id: string;
  quarantineNo: string;
  entryDate: string;
  grnNo: string;
  supplierName: string;
  materialCode: string;
  materialName: string;
  qty: number;
  unit: string;
  supplierLotBatch: string;
  coaVerification: CoaVerificationStatus;
  dispositionStatus: QuarantineDispositionStatus;
  warehouse: string;
  defectCategory: QuarantineDefectCategory;
  defectType: string;
  defectLocation: string;
  estimatedValue: number;
  lossAccount?: string;
  evidenceUrl?: string;
  executedAt?: string;
  // Backward compat aliases
  code?: string;
  date?: string;
  batchNo?: string;
  status?: QuarantineDispositionStatus;
}

export interface ResolveFormState {
  refCode: string;
  materialName: string;
  qty: number;
  unit: string;
  action: string;
  lossAccount: string;
  evidenceNote: string;
  justification: string;
}
