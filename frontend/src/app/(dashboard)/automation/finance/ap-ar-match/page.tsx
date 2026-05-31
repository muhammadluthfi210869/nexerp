"use client";

import { AutomationShell } from "@/components/automation/AutomationShell";

const DATA_SOURCES = [
  { model: "Invoice", fields: ["outstandingAmount", "invoiceNumber", "type"] },
  { model: "Payment", fields: ["amountPaid", "paymentDate", "invoiceId"] },
];

const PREVIEW_COLUMNS = [
  { key: "invoice", label: "Invoice" },
  { key: "amount", label: "Amount", format: "currency" },
  { key: "payment", label: "Payment", format: "currency" },
  { key: "match", label: "Match", format: "badge" },
  { key: "confidence", label: "Confidence" },
];

const PREVIEW_DATA = [
  { invoice: "INV-001", amount: 50000000, payment: 50000000, match: "Perfect", confidence: "100%" },
  { invoice: "INV-002", amount: 25000000, payment: 24875000, match: "Fuzzy", confidence: "95%" },
  { invoice: "INV-003", amount: 75000000, payment: 0, match: "Unmatched", confidence: "-" },
];

export default function ApArMatchPage() {
  return (
    <AutomationShell
      title="AP/AR Auto-Matching"
      division="Finance"
      fase={5}
      dataReady={true}
      isAI={true}
      dataSources={DATA_SOURCES}
      previewColumns={PREVIEW_COLUMNS}
      previewData={PREVIEW_DATA}
    >
      <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
        AI mencocokkan pembayaran dengan invoice berdasarkan amount dan referensi. Perfect match
        jika exact. Fuzzy match jika selisih &le;5% (AI menentukan threshold optimum dari histori).
      </p>
    </AutomationShell>
  );
}
