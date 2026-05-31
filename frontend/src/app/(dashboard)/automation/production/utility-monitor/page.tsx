"use client";
import { AutomationShell } from "@/components/automation/AutomationShell";

const configFields = [
  { name: "electricityMeter", type: "input", description: "Link to electricity meter (modbus/iot)", default: "-" },
];

const dataSources = [
  { model: "Machine", fields: ["costPerHour", "name", "type"] },
  { model: "ProductionSchedule", fields: ["startTime", "endTime"] },
];

const previewColumns = [
  { key: "batch", label: "Batch" },
  { key: "product", label: "Product" },
  { key: "kwh", label: "kWh", format: "number" as const },
  { key: "water", label: "Water (m³)", format: "number" as const },
  { key: "costPerKg", label: "Cost/kg", format: "currency" as const },
  { key: "efficiency", label: "Efficiency", format: "badge" as const },
];

const previewData = [
  { batch: "BATCH-001", product: "Shampoo Sachet", kwh: 1450, water: 3.2, costPerKg: 4850, efficiency: "Aman" },
  { batch: "BATCH-002", product: "Body Wash 250ml", kwh: 890, water: 1.8, costPerKg: 5200, efficiency: "Aman" },
  { batch: "BATCH-003", product: "Lotion 150ml", kwh: 2100, water: 4.5, costPerKg: 7230, efficiency: "Warning" },
  { batch: "BATCH-004", product: "Hand Sanitizer", kwh: 670, water: 1.1, costPerKg: 3890, efficiency: "Aman" },
  { batch: "BATCH-005", product: "Face Wash 60ml", kwh: 1820, water: 3.8, costPerKg: 6740, efficiency: "Warning" },
];

export default function Page() {
  return (
    <AutomationShell
      title="Utility Monitoring per Batch"
      division="Production"
      fase={2}
      dataReady={false}
      needsConfig={true}
      configFields={configFields}
      dataSources={dataSources}
      previewColumns={previewColumns}
      previewData={previewData}
    >
      <p className="text-[14px] text-slate-700 leading-relaxed mb-4">
        Memonitor pemakaian <strong>listrik dan air</strong> per batch produksi. Data dari IoT meter / modbus diintegrasikan dengan jadwal produksi untuk menghitung biaya utilitas per kg produk.
      </p>
      <ul className="list-disc list-inside text-[13px] text-slate-600 space-y-1">
        <li>Konsumsi kWh dari meter listrik yang terhubung via <strong>modbus/iot</strong></li>
        <li>Biaya utilitas dihitung dari <strong>Machine.costPerHour</strong> × durasi produksi</li>
        <li>Efisiensi dihitung dari biaya utilitas aktual vs baseline mesin</li>
      </ul>
    </AutomationShell>
  );
}
