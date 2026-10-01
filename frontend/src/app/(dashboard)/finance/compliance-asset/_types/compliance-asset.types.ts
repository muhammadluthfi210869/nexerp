export type ComplianceAssetType = "BPOM" | "HALAL" | "ISO" | "HKI" | "LAINNYA";
export type ComplianceAssetStatus = "ACTIVE" | "WARNING" | "EXPIRED";

export interface ComplianceAsset {
  id: string;
  code: string;
  name: string;
  type: ComplianceAssetType;
  productBrand: string;
  issueDate: string;
  expiryDate: string;
  cost: number;
  monthlyAmortization: number;
  accumulatedAmortization: number;
  daysToExpiry: number;
  status: ComplianceAssetStatus;
}

export interface ComplianceAssetFormData {
  name: string;
  code: string;
  type: ComplianceAssetType;
  brand: string;
  date: string;
  months: string;
  cost: string;
  notes: string;
}
