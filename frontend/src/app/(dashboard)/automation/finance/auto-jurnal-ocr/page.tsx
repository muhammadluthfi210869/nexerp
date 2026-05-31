"use client";

import { AutomationShell } from "@/components/automation/AutomationShell";

const DATA_SOURCES = [
  { model: "JournalEntry", fields: ["date", "reference", "description"] },
  { model: "JournalLine", fields: ["accountId", "debit", "credit"] },
  { model: "Account", fields: ["code", "name"] },
];

const CONFIG_FIELDS = [
  { name: "ocrProvider", type: "select", description: "OCR API provider", default: "Tesseract (local)" },
  { name: "autoPost", type: "boolean", description: "Auto post to journal", default: "false" },
  { name: "confidenceThreshold", type: "number (%)", description: "Minimum OCR confidence", default: "85%" },
];

const PREVIEW_COLUMNS = [
  { key: "document", label: "Document" },
  { key: "extractedVendor", label: "Vendor" },
  { key: "amount", label: "Amount", format: "currency" },
  { key: "confidence", label: "Confidence" },
  { key: "journal", label: "Jurnal", format: "badge" },
];

const PREVIEW_DATA = [
  { document: "INV-2026-001.pdf", extractedVendor: "PT Kimia Farma", amount: 15000000, confidence: "97%", journal: "Created" },
  { document: "INV-2026-002.pdf", extractedVendor: "CV Sinar Abadi", amount: 8500000, confidence: "82%", journal: "Review" },
  { document: "STRUK-2026-05.jpg", extractedVendor: "Toko ABC", amount: 250000, confidence: "65%", journal: "Failed" },
];

export default function AutoJurnalOcrPage() {
  return (
    <AutomationShell
      title="Auto Jurnal dari OCR"
      division="Finance"
      fase={5}
      dataReady={false}
      needsConfig={true}
      isAI={true}
      configFields={CONFIG_FIELDS}
      dataSources={DATA_SOURCES}
      previewColumns={PREVIEW_COLUMNS}
      previewData={PREVIEW_DATA}
    >
      <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
        Upload dokumen (invoice, kuitansi, bukti bayar) &rarr; OCR extract vendor, amount, date &rarr;
        auto-create journal entry. Confidence &ge; threshold auto-post, di bawahnya manual review.
      </p>
    </AutomationShell>
  );
}
