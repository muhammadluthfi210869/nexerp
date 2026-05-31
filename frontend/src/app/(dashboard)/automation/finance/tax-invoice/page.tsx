"use client";

import { AutomationShell } from "@/components/automation/AutomationShell";

const DATA_SOURCES = [
  { model: "SystemSequence", fields: ["prefix", "period", "lastValue"] },
  { model: "Invoice", fields: ["invoiceNumber", "issuedAt"] },
];

const PREVIEW_COLUMNS = [
  { key: "period", label: "Periode" },
  { key: "prefix", label: "Prefix" },
  { key: "lastNumber", label: "Last Number" },
  { key: "nextNumber", label: "Next Number" },
  { key: "format", label: "Format" },
];

const PREVIEW_DATA = [
  { period: "Juni 2026", prefix: "FA", lastNumber: "025", nextNumber: "026", format: "FA-2606-026" },
  { period: "Mei 2026", prefix: "FA", lastNumber: "098", nextNumber: "099", format: "FA-2605-099" },
  { period: "Juni 2026", prefix: "INV", lastNumber: "150", nextNumber: "151", format: "INV-2606-151" },
];

export default function TaxInvoicePage() {
  return (
    <AutomationShell
      title="Auto Tax Invoice Number"
      division="Finance"
      fase={0}
      dataReady={true}
      dataSources={DATA_SOURCES}
      previewColumns={PREVIEW_COLUMNS}
      previewData={PREVIEW_DATA}
    >
      <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
        Setiap kali invoice dibuat, sistem akan otomatis mengenerate nomor faktur pajak
        berdasarkan sequence per periode. Format: <code className="bg-slate-100 px-2 py-0.5 rounded text-[12px] font-mono">PREFIX-YYMM-SEQ</code>.
        Menggunakan <strong>SystemSequence</strong> yang sudah ada untuk menjamin tidak ada duplikasi nomor.
      </p>
    </AutomationShell>
  );
}
