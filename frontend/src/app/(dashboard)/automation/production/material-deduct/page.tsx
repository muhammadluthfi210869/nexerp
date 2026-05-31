"use client";
import { AutomationShell } from "@/components/automation/AutomationShell";

const dataSources = [
  { model: "ProductionLog", fields: ["materialInventoryId", "inputQty", "stage"] },
  { model: "FormulaItem", fields: ["dosagePercentage", "materialId"] },
  { model: "InventoryTransaction", fields: ["materialId", "quantity", "type"] },
];

const previewColumns = [
  { key: "batch", label: "Batch" },
  { key: "material", label: "Material" },
  { key: "theoretical", label: "Theoretical", format: "number" as const },
  { key: "actualUsed", label: "Actual Used", format: "number" as const },
  { key: "variance", label: "Variance", format: "number" as const },
  { key: "status", label: "Status", format: "badge" as const },
];

const previewData = [
  { batch: "BATCH-001", material: "Sodium Laureth Sulfate - 70%", theoretical: 250, actualUsed: 248, variance: -2, status: "Aman" },
  { batch: "BATCH-002", material: "Cocamidopropyl Betaine - 30%", theoretical: 120, actualUsed: 125, variance: 5, status: "Warning" },
  { batch: "BATCH-003", material: "Glycerin - USP", theoretical: 45, actualUsed: 44.2, variance: -0.8, status: "Aman" },
  { batch: "BATCH-004", material: "Fragrance Oil - Jasmine", theoretical: 8.5, actualUsed: 9.1, variance: 0.6, status: "Warning" },
  { batch: "BATCH-005", material: "Citric Acid - Anhydrous", theoretical: 15, actualUsed: 18.3, variance: 3.3, status: "Kritis" },
];

export default function Page() {
  return (
    <AutomationShell
      title="Material Consumption Auto Deduct"
      division="Production"
      fase={2}
      dataReady={true}
      dataSources={dataSources}
      previewColumns={previewColumns}
      previewData={previewData}
    >
      <p className="text-[14px] text-slate-700 leading-relaxed mb-4">
        Otomatis mencatat pemakaian material berdasarkan <strong>production log</strong> dan <strong>formula item</strong> setiap kali batch selesai diproses. Sistem mencocokkan jumlah actual yang dipakai di lantai produksi dengan takaran teoritis dari formula.
      </p>
      <ul className="list-disc list-inside text-[13px] text-slate-600 space-y-1">
        <li>Data langsung dari <strong>ProductionLog.inputQty</strong> tiap stage</li>
        <li>Variansi &gt;5% akan trigger <strong>Warning</strong>, &gt;10% jadi <strong>Kritis</strong></li>
        <li>Update stok material via <strong>InventoryTransaction</strong> otomatis</li>
      </ul>
    </AutomationShell>
  );
}
