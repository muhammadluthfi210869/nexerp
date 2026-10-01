export type DpCategory = "sample" | "legalitas" | "produksi";

export type DpStatus = "FULL" | "PARTIAL" | "UNUSED";

export interface DpRecord {
  id: string;
  code: string;
  category: DpCategory;
  date: string;
  customerName: string;
  brandName: string;
  refNumber: string; // SMP-xxx or REG-BPOM-xxx or SO-xxx
  bankAccount: string;
  amount: number;
  usedAmount: number;
  remainingAmount: number;
  status: DpStatus;
  notes?: string;
}

export const statusBadgeConfig: Record<string, { status: "success" | "warning" | "info"; label: string }> = {
  FULL: { status: "success", label: "Terpakai Penuh" },
  PARTIAL: { status: "warning", label: "Terpakai Sebagian" },
  UNUSED: { status: "info", label: "Belum Terpakai" },
};
