"use client";
import { AutomationShell } from "@/components/automation/AutomationShell";

const dataSources = [
  { model: "ProductionSchedule", fields: ["startTime", "endTime", "resultQty", "targetQty"] },
  { model: "ProductionLog", fields: ["goodQty", "rejectQty", "downtimeMinutes"] },
  { model: "Machine", fields: ["name", "capacityPerBatch", "costPerHour"] },
];

const previewColumns = [
  { key: "machine", label: "Machine" },
  { key: "availability", label: "Availability", format: "number" as const },
  { key: "performance", label: "Performance", format: "number" as const },
  { key: "quality", label: "Quality", format: "number" as const },
  { key: "oee", label: "OEE", format: "number" as const },
  { key: "grade", label: "Grade", format: "badge" as const },
];

const previewData = [
  { machine: "Mixer-01", availability: 92.5, performance: 88.3, quality: 97.8, oee: 79.8, grade: "Good" },
  { machine: "Filler-02", availability: 95.1, performance: 93.2, quality: 99.1, oee: 87.9, grade: "World Class" },
  { machine: "Capper-01", availability: 85.3, performance: 79.6, quality: 95.2, oee: 64.7, grade: "Good" },
  { machine: "Labeler-03", availability: 78.2, performance: 72.4, quality: 93.5, oee: 52.9, grade: "Poor" },
  { machine: "Packer-01", availability: 90.8, performance: 86.1, quality: 97.2, oee: 75.9, grade: "Good" },
];

export default function Page() {
  return (
    <AutomationShell
      title="OEE Dashboard"
      division="Production"
      fase={3}
      dataReady={true}
      dataSources={dataSources}
      previewColumns={previewColumns}
      previewData={previewData}
    >
      <p className="text-[14px] text-slate-700 leading-relaxed mb-4">
        Menghitung <strong>Overall Equipment Effectiveness</strong> (OEE) untuk setiap mesin secara otomatis dari data produksi dan jadwal. OEE = Availability × Performance × Quality.
      </p>
      <ul className="list-disc list-inside text-[13px] text-slate-600 space-y-1">
        <li><strong>Availability</strong> = (Waktu tersedia − Downtime) / Waktu tersedia × 100%</li>
        <li><strong>Performance</strong> = Produksi aktual / Kapasitas ideal × 100%</li>
        <li><strong>Quality</strong> = Good Qty / Total Qty × 100%</li>
        <li>Grade: &gt;85% = World Class, &gt;60% = Good, &lt;60% = Poor</li>
      </ul>
    </AutomationShell>
  );
}
