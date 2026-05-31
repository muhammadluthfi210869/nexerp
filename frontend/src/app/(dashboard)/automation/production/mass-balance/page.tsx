"use client";
import { AutomationShell } from "@/components/automation/AutomationShell";

const dataSources = [
  { model: "ProductionLog", fields: ["inputQty", "goodQty", "rejectQty", "quarantineQty", "shrinkageQty"] },
  { model: "FormulaItem", fields: ["dosagePercentage", "qtyTheoretical"] },
];

const previewColumns = [
  { key: "batch", label: "Batch" },
  { key: "totalIn", label: "Total In", format: "number" as const },
  { key: "goodOut", label: "Good Out", format: "number" as const },
  { key: "reject", label: "Reject", format: "number" as const },
  { key: "shrinkage", label: "Shrinkage", format: "number" as const },
  { key: "balance", label: "Balance", format: "number" as const },
  { key: "accuracy", label: "Accuracy", format: "number" as const },
];

const previewData = [
  { batch: "BATCH-001", totalIn: 500, goodOut: 476, reject: 8, shrinkage: 11, balance: 5, accuracy: 99.0 },
  { batch: "BATCH-002", totalIn: 200, goodOut: 182, reject: 6, shrinkage: 8, balance: 4, accuracy: 98.0 },
  { batch: "BATCH-003", totalIn: 350, goodOut: 335, reject: 4, shrinkage: 5, balance: 6, accuracy: 98.3 },
  { batch: "BATCH-004", totalIn: 150, goodOut: 128, reject: 10, shrinkage: 15, balance: -3, accuracy: 98.0 },
  { batch: "BATCH-005", totalIn: 280, goodOut: 262, reject: 5, shrinkage: 8, balance: 5, accuracy: 98.2 },
];

export default function Page() {
  return (
    <AutomationShell
      title="Mass Balance Automation"
      division="Production"
      fase={3}
      dataReady={true}
      dataSources={dataSources}
      previewColumns={previewColumns}
      previewData={previewData}
    >
      <p className="text-[14px] text-slate-700 leading-relaxed mb-4">
        Otomatis menghitung <strong>neraca massa</strong> untuk setiap batch produksi. Memastikan bahwa input material setara dengan output (good + reject + shrinkage + quarantine) dalam batas toleransi.
      </p>
      <ul className="list-disc list-inside text-[13px] text-slate-600 space-y-1">
        <li>Balance = Total In − (Good Out + Reject + Shrinkage + Quarantine)</li>
        <li>Akurasi = (Good Out + Reject + Shrinkage) / Total In × 100%</li>
        <li>Deviasi &gt;2% akan di-flag untuk investigasi</li>
      </ul>
    </AutomationShell>
  );
}
