export interface ReceivablePayment {
  id: string;
  invoiceNumber: string;
  customerName: string;
  brandName?: string;
  paymentDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  pph23Deduction: number; // Potongan PPh 23 (2% Jasa Maklon)
  pph21Deduction: number; // Potongan PPh 21 Tenaga Ahli/Komisi
  netCashReceived: number; // Kas Bersih Masuk Bank
  bankAccount: string;
  status: "PAID" | "PARTIAL" | "OVERDUE" | "UNPAID";
  notes?: string;
}

export type PaymentStatus = ReceivablePayment["status"];

export const statusBadgeConfig: Record<
  string,
  { status: "success" | "warning" | "critical" | "default"; label: string }
> = {
  PAID: { status: "success", label: "Lunas" },
  PARTIAL: { status: "warning", label: "Sebagian" },
  OVERDUE: { status: "critical", label: "Overdue" },
  UNPAID: { status: "default", label: "Belum Bayar" },
};

export interface PaymentFormData {
  payAmount: string;
  pph23: string;
  pph21: string;
  bank: string;
  date: string;
  notes: string;
}
