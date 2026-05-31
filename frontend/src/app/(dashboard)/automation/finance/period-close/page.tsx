"use client";

import { AutomationShell } from "@/components/automation/AutomationShell";

const DATA_SOURCES = [
  { model: "FinancialPeriod", fields: ["name", "startDate", "endDate", "status"] },
];

const PREVIEW_COLUMNS = [
  { key: "period", label: "Period" },
  { key: "startDate", label: "Start" },
  { key: "endDate", label: "End" },
  { key: "status", label: "Status", format: "badge" },
  { key: "autoClose", label: "Auto Close" },
];

const PREVIEW_DATA = [
  { period: "Mei 2026", startDate: "01/05/2026", endDate: "31/05/2026", status: "Locked", autoClose: "✅ Closed otomatis" },
  { period: "Juni 2026", startDate: "01/06/2026", endDate: "30/06/2026", status: "Open", autoClose: "🔓 Active" },
  { period: "Juli 2026", startDate: "01/07/2026", endDate: "31/07/2026", status: "Pending", autoClose: "⏳ Menunggu" },
];

export default function PeriodClosePage() {
  return (
    <AutomationShell
      title="Period Auto-Close"
      division="Finance"
      fase={0}
      dataReady={true}
      dataSources={DATA_SOURCES}
      previewColumns={PREVIEW_COLUMNS}
      previewData={PREVIEW_DATA}
    >
      <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
        Cron job harian yang mengecek <strong>FinancialPeriod.endDate</strong>. Jika tanggal sudah terlewat,
        sistem otomatis mengunci period (status &rarr; LOCKED) dan membuka period berikutnya.
        Mencegah jurnal masuk ke period yang salah setelah closing.
      </p>
    </AutomationShell>
  );
}
