"use client";

import { AutomationShell } from "@/components/automation/AutomationShell";

const DATA_SOURCES = [
  { model: "FinancialSummaryLedger", fields: ["periodId", "category", "nominalValue"] },
  { model: "Account", fields: ["code", "name", "reportGroup"] },
  { model: "JournalLine", fields: ["accountId", "debit", "credit"] },
];

const PREVIEW_COLUMNS = [
  { key: "account", label: "Account" },
  { key: "budget", label: "Budget", format: "currency" },
  { key: "actual", label: "Actual", format: "currency" },
  { key: "used", label: "% Used", format: "number" },
  { key: "status", label: "Status", format: "badge" },
];

const PREVIEW_DATA = [
  { account: "Beban Gaji", budget: 100000000, actual: 95000000, used: 95, status: "Warning" },
  { account: "Beban Marketing", budget: 50000000, actual: 55000000, used: 110, status: "Over" },
  { account: "Beban Operasional", budget: 75000000, actual: 60000000, used: 80, status: "Aman" },
  { account: "Beban R&D", budget: 30000000, actual: 31000000, used: 103, status: "Over" },
];

export default function OverBudgetPage() {
  return (
    <AutomationShell
      title="Over Budget Notification"
      division="Finance"
      fase={2}
      dataReady={true}
      dataSources={DATA_SOURCES}
      previewColumns={PREVIEW_COLUMNS}
      previewData={PREVIEW_DATA}
    >
      <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
        Sistem membandingkan realisasi anggaran (debit aktual) vs budget yang ditetapkan per account.
        Jika penggunaan melebihi 100%, notifikasi otomatis dikirim ke manager divisi dan finance.
      </p>
    </AutomationShell>
  );
}
