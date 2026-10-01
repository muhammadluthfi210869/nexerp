export type ReturnType = "POTONG_TAGIHAN" | "GANTI_BARANG" | "REFUND";
export type ReturnStatus = "PROSES" | "QC_PASSED" | "SELESAI" | "DITOLAK";

export interface SalesReturn {
  id: string;
  returnCode: string;
  soId: string;
  soNumber: string;
  customerName: string;
  brandName?: string;
  returnDate: string;
  warehouseId?: string;
  warehouseName: string;
  productName: string;
  qtyReturned: number;
  unitPrice: number;
  totalValue: number;
  returnType: ReturnType;
  status: ReturnStatus;
  reason: string;
}

export interface StatusBadgeConfig {
  status: "warning" | "info" | "success" | "critical";
  label: string;
}

export const statusBadgeConfig: Record<string, StatusBadgeConfig> = {
  PROSES: { status: "warning", label: "Inspeksi QC" },
  QC_PASSED: { status: "info", label: "QC Lolos (Karantina)" },
  SELESAI: { status: "success", label: "Selesai (Di-Offset)" },
  DITOLAK: { status: "critical", label: "Ditolak QC" },
};
