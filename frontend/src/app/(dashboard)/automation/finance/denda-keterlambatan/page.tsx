"use client";

import { AutomationShell } from "@/components/automation/AutomationShell";

const DATA_SOURCES = [
  { model: "Invoice", fields: ["dueDate", "outstandingAmount", "paidAt"] },
  { model: "Payment", fields: ["amountPaid", "paymentDate"] },
];

const CONFIG_FIELDS = [
  { name: "lateFeeRate", type: "number (%)", description: "Fee per day late", default: "0.05%/day" },
  { name: "maxLateFee", type: "number (%)", description: "Maximum late fee % of invoice", default: "15%" },
  { name: "gracePeriod", type: "number (days)", description: "Grace period before fee starts", default: "7 days" },
];

const PREVIEW_COLUMNS = [
  { key: "invoice", label: "Invoice" },
  { key: "due", label: "Due Date" },
  { key: "paid", label: "Paid Date" },
  { key: "daysLate", label: "Days Late", format: "number" },
  { key: "feeAmount", label: "Fee Amount", format: "currency" },
];

const PREVIEW_DATA = [
  { invoice: "INV-001", due: "24/05/2026", paid: "31/05/2026", daysLate: 7, feeAmount: 175000 },
  { invoice: "INV-003", due: "10/05/2026", paid: "20/05/2026", daysLate: 10, feeAmount: 250000 },
  { invoice: "INV-005", due: "01/06/2026", paid: "15/06/2026", daysLate: 14, feeAmount: 350000 },
];

export default function DendaKeterlambatanPage() {
  return (
    <AutomationShell
      title="Auto Denda Keterlambatan"
      division="Finance"
      fase={1}
      dataReady={false}
      needsConfig={true}
      configFields={CONFIG_FIELDS}
      dataSources={DATA_SOURCES}
      previewColumns={PREVIEW_COLUMNS}
      previewData={PREVIEW_DATA}
    >
      <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
        Saat pembayaran diterima, sistem menghitung denda keterlambatan berdasarkan jumlah hari
        melewati due date. Denda otomatis dihitung dan dicatat sebagai jurnal terpisah.
      </p>
    </AutomationShell>
  );
}
