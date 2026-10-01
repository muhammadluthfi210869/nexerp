export type AssetCategory = "Inventaris" | "Motor" | "Mobil" | "Bangunan";
export type AssetStatus = "AKTIF" | "DISPOSAL" | "MAINTENANCE";

export interface PurchaseHistoryItem {
  date: string;
  type: string;
  invoiceRef: string;
  amount: number;
  notes: string;
}

export interface AssetRegisterItem {
  id: string;
  assetCode: string; // Universal Global: DL-FIN-AST-09092026-0001
  name: string;
  category: AssetCategory;
  acquisitionDate: string;
  acquisitionCost: number;
  depreciationMethod: string;
  usefulLifeYears: number;
  accumDepreciation: number;
  bookValue: number;
  status: AssetStatus;
  location: string;
  department: string;
  purchaseHistory: PurchaseHistoryItem[];
}

export interface AssetFormData {
  name: string;
  category: AssetCategory;
  acquisitionDate: string;
  cost: string;
  location: string;
  department: string;
}
