"use client";

import { AutomationShell } from "@/components/automation/AutomationShell";

const DATA_SOURCES = [
  { model: "MaterialItem", fields: ["unitPrice", "marginThreshold"] },
  { model: "MaterialValuation", fields: ["movingAveragePrice", "lastPurchasePrice"] },
  { model: "PurchaseOrderItem", fields: ["unitPrice", "quantity"] },
];

const CONFIG_FIELDS = [
  { name: "marginThreshold", type: "number (%)", description: "Minimum margin % before alert", default: "15%" },
  { name: "checkOnPoReceipt", type: "boolean", description: "Check when PO received", default: "true" },
];

const PREVIEW_COLUMNS = [
  { key: "material", label: "Material" },
  { key: "lastPrice", label: "Last Price", format: "currency" },
  { key: "newPrice", label: "New Price", format: "currency" },
  { key: "increase", label: "% Increase", format: "number" },
  { key: "impact", label: "Impact", format: "badge" },
];

const PREVIEW_DATA = [
  { material: "Chemical A", lastPrice: 50000, newPrice: 65000, increase: 30, impact: "Kritis" },
  { material: "Packaging B", lastPrice: 2000, newPrice: 2100, increase: 5, impact: "Aman" },
  { material: "Fragrance C", lastPrice: 150000, newPrice: 180000, increase: 20, impact: "Warning" },
];

export default function MarginAlertPage() {
  return (
    <AutomationShell
      title="Margin Protection Alert"
      division="Finance / SCM"
      fase={1}
      dataReady={false}
      needsConfig={true}
      configFields={CONFIG_FIELDS}
      dataSources={DATA_SOURCES}
      previewColumns={PREVIEW_COLUMNS}
      previewData={PREVIEW_DATA}
    >
      <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
        Ketika purchase order diterima, sistem membandingkan harga beli baru dengan moving average.
        Jika kenaikan harga menyebabkan margin di bawah threshold, sistem mengirim notifikasi
        ke finance dan SCM untuk mereview harga jual.
      </p>
    </AutomationShell>
  );
}
