"use client";
import { AutomationShell } from "@/components/automation/AutomationShell";

const dataSources = [
  { model: "ProductionLog", fields: ["inputQty", "goodQty", "rejectQty", "shrinkageQty"] },
  { model: "Formula", fields: ["targetYieldGram"] },
];

const previewColumns = [
  { key: "batch", label: "Batch" },
  { key: "product", label: "Product" },
  { key: "targetYield", label: "Target Yield", format: "number" as const },
  { key: "actualYield", label: "Actual Yield", format: "number" as const },
  { key: "variance", label: "Variance", format: "number" as const },
  { key: "alert", label: "Alert", format: "badge" as const },
];

const previewData = [
  { batch: "BATCH-001", product: "Shampoo Sachet 50ml", targetYield: 500, actualYield: 487, variance: -13, alert: "Aman" },
  { batch: "BATCH-002", product: "Body Wash 250ml", targetYield: 200, actualYield: 176, variance: -24, alert: "Warning" },
  { batch: "BATCH-003", product: "Hand Sanitizer 100ml", targetYield: 350, actualYield: 348, variance: -2, alert: "Aman" },
  { batch: "BATCH-004", product: "Lotion 150ml", targetYield: 150, actualYield: 128, variance: -22, alert: "Kritis" },
  { batch: "BATCH-005", product: "Face Wash 60ml", targetYield: 280, actualYield: 271, variance: -9, alert: "Warning" },
];

export default function Page() {
  return (
    <AutomationShell
      title="Production Leakage Auto-Alert"
      division="Production"
      fase={2}
      dataReady={true}
      dataSources={dataSources}
      previewColumns={previewColumns}
      previewData={previewData}
    >
      <p className="text-[14px] text-slate-700 leading-relaxed mb-4">
        Memonitor <strong>yield</strong> tiap batch secara real-time. Jika actual yield turun di bawah 95% dari target, sistem mengirim notifikasi ke supervisor produksi dan QC.
      </p>
      <ul className="list-disc list-inside text-[13px] text-slate-600 space-y-1">
        <li>Yield dihitung dari <strong>goodQty / inputQty × 100%</strong></li>
        <li>Yellow flag jika yield 90-95%, Red flag jika &lt;90%</li>
        <li>Data shrinkage dari tiap stage dirunut untuk lacak titik bocor</li>
      </ul>
    </AutomationShell>
  );
}
