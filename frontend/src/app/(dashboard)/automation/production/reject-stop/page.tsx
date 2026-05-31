"use client";
import { AutomationShell } from "@/components/automation/AutomationShell";

const configFields = [
  { name: "rejectThreshold", type: "number (%)", description: "Reject % before auto-stop", default: "5%" },
  { name: "sampleSize", type: "number", description: "Samples before triggering", default: "10" },
];

const dataSources = [
  { model: "QCAudit", fields: ["severity", "defectCategory", "stepLogId"] },
  { model: "ProductionLog", fields: ["rejectQty", "goodQty"] },
];

const previewColumns = [
  { key: "batch", label: "Batch" },
  { key: "product", label: "Product" },
  { key: "rejectRate", label: "Reject Rate", format: "number" as const },
  { key: "threshold", label: "Threshold", format: "number" as const },
  { key: "action", label: "Action", format: "badge" as const },
];

const previewData = [
  { batch: "BATCH-001", product: "Shampoo Sachet", rejectRate: 2.3, threshold: 5, action: "Aman" },
  { batch: "BATCH-002", product: "Body Wash 250ml", rejectRate: 4.8, threshold: 5, action: "Aman" },
  { batch: "BATCH-003", product: "Shampoo Sachet", rejectRate: 7.1, threshold: 5, action: "Warning" },
  { batch: "BATCH-004", product: "Lotion 150ml", rejectRate: 1.2, threshold: 5, action: "Aman" },
  { batch: "BATCH-005", product: "Face Wash 60ml", rejectRate: 11.5, threshold: 5, action: "Kritis" },
];

export default function Page() {
  return (
    <AutomationShell
      title="Auto Reject Stop"
      division="Production / QC"
      fase={2}
      dataReady={false}
      needsConfig={true}
      configFields={configFields}
      dataSources={dataSources}
      previewColumns={previewColumns}
      previewData={previewData}
    >
      <p className="text-[14px] text-slate-700 leading-relaxed mb-4">
        Otomatis menghentikan produksi jika <strong>reject rate</strong> melebihi threshold yang ditentukan dalam periode sampling. Mencegah produksi lanjutan yang menghasilkan produk cacat dalam jumlah besar.
      </p>
      <ul className="list-disc list-inside text-[13px] text-slate-600 space-y-1">
        <li>Reject rate dihitung dari <strong>rejectQty / (goodQty + rejectQty) × 100%</strong></li>
        <li>Trigger setelah <strong>sampleSize</strong> batch terakhir dilampaui</li>
        <li>Notifikasi ke supervisor dan QC + opsi auto-stop via PLC</li>
      </ul>
    </AutomationShell>
  );
}
