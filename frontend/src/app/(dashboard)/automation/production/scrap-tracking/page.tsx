"use client";
import { AutomationShell } from "@/components/automation/AutomationShell";

const dataSources = [
  { model: "ProductionLog", fields: ["qtyReject", "shrinkageQty"] },
  { model: "COPQRecord", fields: ["materialLoss", "laborLoss", "overheadLoss", "totalLoss"] },
];

const previewColumns = [
  { key: "period", label: "Period" },
  { key: "product", label: "Product" },
  { key: "scrapQty", label: "Scrap Qty", format: "number" as const },
  { key: "materialLoss", label: "Material Loss", format: "currency" as const },
  { key: "totalCost", label: "Total Cost", format: "currency" as const },
  { key: "trend", label: "Trend", format: "badge" as const },
];

const previewData = [
  { period: "Jan 2026", product: "Shampoo Sachet", scrapQty: 1250, materialLoss: 8750000, totalLoss: 12480000, trend: "Aman" },
  { period: "Jan 2026", product: "Body Wash 250ml", scrapQty: 340, materialLoss: 6120000, totalLoss: 8950000, trend: "Aman" },
  { period: "Feb 2026", product: "Shampoo Sachet", scrapQty: 2180, materialLoss: 15260000, totalLoss: 21340000, trend: "Kritis" },
  { period: "Feb 2026", product: "Lotion 150ml", scrapQty: 480, materialLoss: 14400000, totalLoss: 19200000, trend: "Warning" },
  { period: "Mar 2026", product: "Shampoo Sachet", scrapQty: 980, materialLoss: 6860000, totalLoss: 10120000, trend: "Aman" },
];

export default function Page() {
  return (
    <AutomationShell
      title="Scrap / Waste Auto Tracking"
      division="Production / QC"
      fase={2}
      dataReady={true}
      dataSources={dataSources}
      previewColumns={previewColumns}
      previewData={previewData}
    >
      <p className="text-[14px] text-slate-700 leading-relaxed mb-4">
        Melacak <strong>scrap dan waste</strong> secara otomatis dari production log dan menghitung biaya total (material, tenaga kerja, overhead) via COPQ.
      </p>
      <ul className="list-disc list-inside text-[13px] text-slate-600 space-y-1">
        <li>Scrap quantity diambil dari <strong>ProductionLog.qtyReject</strong></li>
        <li>Biaya dihitung dari <strong>COPQRecord</strong> — breakdown material, labor, overhead</li>
        <li>Tren bulanan untuk identifikasi area perbaikan berkelanjutan</li>
      </ul>
    </AutomationShell>
  );
}
