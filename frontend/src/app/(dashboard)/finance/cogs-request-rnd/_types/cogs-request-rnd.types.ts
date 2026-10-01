export type CogsRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CogsRequest {
  id: string;
  requestCode: string;
  requestDate: string;
  customerName: string;
  productName: string;
  formulaCode: string;
  moqQty: number;
  status: CogsRequestStatus;
  statusLabel: string;
  // Detail Costing
  formulaCost: number;
  primaryPackCost: number;
  secondaryPackCost: number;
  laborCost: number;
  overheadCost: number;
  totalHppPerPcs: number;
  recommendedPrice: number;
  notes?: string;
}

export interface CogsFormData {
  pelanggan: string;
  salesSample: string;
  formula: string;
  tanggal: string;
  kemasanPrimer: string;
  kemasanPrimer2: string;
  kemasanSekunder: string;
  netto: string;
  jumlahMoq: number;
}
