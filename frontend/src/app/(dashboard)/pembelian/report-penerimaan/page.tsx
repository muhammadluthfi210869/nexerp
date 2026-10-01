"use client";

import React from "react";
import { Download } from "lucide-react";
import { DnaPageHeader, DnaButton } from "@/components/dna";
import {
  ReportPenerimaanKpiCards,
  ReportPenerimaanTable,
  ReportPenerimaanDetailDrawer,
} from "./_components";
import { useReportPenerimaanOperations } from "./_hooks/useReportPenerimaanOperations";

export default function ReportPenerimaanPage() {
  const {
    isLoading,
    isError,
    refetch,
    searchQuery,
    setSearchQuery,
    filteredList,
    kpis,
    selectedRow,
    setSelectedRow,
    handleExportCsv,
  } = useReportPenerimaanOperations();

  return (
    <div className="p-6 space-y-6">
      <DnaPageHeader
        title="Laporan Penerimaan Barang"
        description="Monitoring logistik dan riwayat barang masuk dari supplier dengan rincian fisik: Diterima, Bagus, Reject, dan Barang Gratis (Free)."
        extraActions={
          <DnaButton
            variant="secondary"
            onClick={handleExportCsv}
            disabled={filteredList.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </DnaButton>
        }
      />

      <ReportPenerimaanKpiCards kpis={kpis} />

      <ReportPenerimaanTable
        isLoading={isLoading}
        isError={isError}
        refetch={refetch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filteredList={filteredList}
        onSelectRow={setSelectedRow}
      />

      <ReportPenerimaanDetailDrawer
        selectedRow={selectedRow}
        onClose={() => setSelectedRow(null)}
      />
    </div>
  );
}
