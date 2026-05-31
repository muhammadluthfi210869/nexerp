"use client";

import { AutomationShell } from "@/components/automation/AutomationShell";

const DATA_SOURCES = [
  { model: "Account", fields: ["code", "name", "type", "parentId"] },
  { model: "MasterCategory", fields: ["name", "type"] },
  { model: "MaterialItem", fields: ["name", "code", "categoryId"] },
];

const PREVIEW_COLUMNS = [
  { key: "source", label: "Source" },
  { key: "coaCode", label: "COA Code" },
  { key: "coaName", label: "COA Name" },
  { key: "type", label: "Type", format: "badge" },
];

const PREVIEW_DATA = [
  { source: "Kategori: Bahan Baku", coaCode: "11611", coaName: "Persediaan Bahan Baku", type: "Auto" },
  { source: "Kategori: Bahan Pembantu", coaCode: "11612", coaName: "Persediaan Bahan Pembantu", type: "Auto" },
  { source: "Material: Chemical X", coaCode: "11611001", coaName: "Chemical X", type: "Auto" },
  { source: "Kategori: Penjualan", coaCode: "41111", coaName: "Penjualan - Barang Jadi", type: "Auto" },
];

export default function CoaGeneratorPage() {
  return (
    <AutomationShell
      title="COA Auto Generator"
      division="Finance / Master Data"
      fase={2}
      dataReady={true}
      dataSources={DATA_SOURCES}
      previewColumns={PREVIEW_COLUMNS}
      previewData={PREVIEW_DATA}
    >
      <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
        Saat kategori barang atau material baru dibuat, sistem otomatis membuat akun COA
        yang sesuai. Menggunakan prefix standar akuntansi: 116xx untuk persediaan,
        4xxxxx untuk penjualan, 5xxxxx untuk HPP.
      </p>
    </AutomationShell>
  );
}
