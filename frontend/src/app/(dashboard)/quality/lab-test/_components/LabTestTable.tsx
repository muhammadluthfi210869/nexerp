import React from "react";
import { FlaskConical, Eye, Printer } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  DnaButton,
} from "@/components/dna";
import type { DnaFilterColumnConfig } from "@/components/dna";
import type { LabTestResult, FormulaItem } from "../_types/lab-test.types";

interface LabTestTableProps {
  formulas?: FormulaItem[];
  selectedFormulaId: string;
  onSelectFormulaId: (id: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  statusOptions: { value: string; label: string; color?: "default" | "success" | "warning" | "critical" | "info" }[];
  selectedStatus: string;
  onSelectStatus: (val: string) => void;
  filterColumns: DnaFilterColumnConfig[];
  selectedColumn: string;
  onSelectColumn: (col: string) => void;
  filterValue: string;
  onFilterValueChange: (val: string) => void;
  dateMode: "ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM";
  onDateModeChange: (mode: "ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM") => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  onResetAll: () => void;
  isLoading: boolean;
  filteredResults: LabTestResult[];
  onViewDetail: (result: LabTestResult) => void;
  onPrint?: (result: LabTestResult) => void;
}

export function LabTestTable({
  formulas,
  selectedFormulaId,
  onSelectFormulaId,
  search,
  onSearchChange,
  statusOptions,
  selectedStatus,
  onSelectStatus,
  filterColumns,
  selectedColumn,
  onSelectColumn,
  filterValue,
  onFilterValueChange,
  dateMode,
  onDateModeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onResetAll,
  isLoading,
  filteredResults,
  onViewDetail,
  onPrint,
}: LabTestTableProps) {
  return (
    <div className="space-y-4">
      {Array.isArray(formulas) && formulas.length > 0 && (
        <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-700 uppercase whitespace-nowrap">
            Pilih Formulasi Uji:
          </span>
          <select
            value={selectedFormulaId}
            onChange={(e) => onSelectFormulaId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-800 focus:outline-none flex-1 max-w-md"
          >
            {formulas.map((f: any) => (
              <option key={f.id} value={f.id}>
                {f.name || f.formulaCode || f.id} (v{f.version || "1.0"})
              </option>
            ))}
          </select>
        </div>
      )}

      <DnaDataTableCard
        count={filteredResults.length}
        toolbarProps={{
          searchValue: search,
          onSearchChange: onSearchChange,
          searchPlaceholder: "Cari No. Uji, Formula, Produk, Parameter...",
          statusOptions: statusOptions,
          selectedStatus: selectedStatus,
          onSelectStatus: onSelectStatus,
          statusPlaceholder: "Semua Status",
          filterColumns: filterColumns,
          selectedColumn: selectedColumn,
          onSelectColumn: onSelectColumn,
          filterValue: filterValue,
          onFilterValueChange: onFilterValueChange,
          enableDateFilter: true,
          dateMode: dateMode,
          onDateModeChange: onDateModeChange,
          startDate: startDate,
          onStartDateChange: onStartDateChange,
          endDate: endDate,
          onEndDateChange: onEndDateChange,
          onResetAll: onResetAll,
        }}
      >
        <div className="w-full overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                <DnaTh className="px-4 py-2.5 w-[50px] text-center">#</DnaTh>
                <DnaTh className="px-4 py-2.5 w-[110px] whitespace-nowrap">Tanggal Uji</DnaTh>
                <DnaTh className="px-4 py-2.5 w-[130px] whitespace-nowrap">No. Uji Lab</DnaTh>
                <DnaTh className="px-4 py-2.5 w-[150px] whitespace-nowrap">No. Batch / Formula Ref</DnaTh>
                <DnaTh className="px-4 py-2.5 min-w-[170px] whitespace-nowrap">Nama Produk / Bahan</DnaTh>
                <DnaTh className="px-4 py-2.5 w-[130px] whitespace-nowrap">Tipe Pengujian</DnaTh>
                <DnaTh className="px-4 py-2.5 w-[150px] whitespace-nowrap">Parameter Uji</DnaTh>
                <DnaTh className="px-4 py-2.5 w-[140px] whitespace-nowrap">Hasil / Nilai Temuan</DnaTh>
                <DnaTh className="px-4 py-2.5 w-[140px] whitespace-nowrap">Standar Baku Mutu</DnaTh>
                <DnaTh className="px-4 py-2.5 text-center w-[120px] whitespace-nowrap">Status Hasil QC</DnaTh>
                <DnaTh className="pr-4 py-2.5 text-right w-[80px] whitespace-nowrap">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={11} className="py-12 text-center text-slate-400">
                    Memuat hasil pengujian laboratorium...
                  </DnaTd>
                </DnaTableRow>
              ) : filteredResults.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={11} className="py-12 text-center text-slate-400">
                    <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada data uji lab untuk formula ini.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredResults.map((r, index) => {
                  const isStable =
                    r.stability40C === "STABLE" &&
                    r.stabilityRT === "STABLE" &&
                    r.stability4C === "STABLE";

                  const badgeVariant =
                    r.status === "PASS" || isStable
                      ? "success"
                      : r.status === "CONDITIONAL"
                      ? "warning"
                      : "danger";

                  const statusLabel =
                    r.status === "PASS" || isStable
                      ? "LULUS QC"
                      : r.status === "CONDITIONAL"
                      ? "BERSYARAT"
                      : "TIDAK MEMENUHI";

                  return (
                    <DnaTableRow
                      key={r.id}
                      className="h-[48px] hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      {/* 1. # */}
                      <DnaTd className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 tabular-nums">
                        {index + 1}
                      </DnaTd>

                      {/* 2. Tanggal Uji */}
                      <DnaTd className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-700 tabular-nums">
                        {r.testDate
                          ? new Date(r.testDate).toLocaleDateString("id-ID")
                          : "—"}
                      </DnaTd>

                      {/* 3. No. Uji Lab */}
                      <DnaTd className="px-4 py-2.5 whitespace-nowrap">
                        <span className="font-bold text-blue-700 text-xs tabular-nums">
                          {r.testNumber || `LAB-${r.id.slice(0, 8).toUpperCase()}`}
                        </span>
                      </DnaTd>

                      {/* 4. No. Batch / Formula Ref */}
                      <DnaTd className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold text-slate-800">
                        {r.batchNumber || r.formulaCode || r.formulaId?.slice(0, 8) || "—"}
                      </DnaTd>

                      {/* 5. Nama Produk / Bahan */}
                      <DnaTd className="px-4 py-2.5 text-xs font-medium text-slate-900 max-w-[200px] truncate">
                        {r.productName || r.formulaName || "Sampel Formulasi"}
                      </DnaTd>

                      {/* 6. Tipe Pengujian */}
                      <DnaTd className="px-4 py-2.5 text-xs text-slate-700 whitespace-nowrap">
                        {r.testType || "Fisikokimia & Organoleptik"}
                      </DnaTd>

                      {/* 7. Parameter Uji */}
                      <DnaTd className="px-4 py-2.5 text-xs text-slate-700 whitespace-nowrap">
                        {r.parameterName || "pH, Viskositas, ALT, Organoleptik"}
                      </DnaTd>

                      {/* 8. Hasil / Nilai Temuan */}
                      <DnaTd className="px-4 py-2.5 text-xs font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                        {r.actualValue || `pH ${r.actualPh || "-"} | ${r.actualViscosity || "-"} cps`}
                      </DnaTd>

                      {/* 9. Standar Baku Mutu */}
                      <DnaTd className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                        {r.standardSpec || "pH 5.0 - 6.5 | 3500 - 5000 cps"}
                      </DnaTd>

                      {/* 10. Status Hasil QC */}
                      <DnaTd className="px-4 py-2.5 text-center whitespace-nowrap">
                        <DnaBadge variant={badgeVariant}>
                          {statusLabel}
                        </DnaBadge>
                      </DnaTd>

                      {/* 11. Aksi */}
                      <DnaTd className="pr-4 py-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {onPrint && (
                            <DnaButton
                              variant="ghost"
                              size="sm"
                              onClick={() => onPrint(r)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                              title="Cetak Certificate of Analysis (A4)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </DnaButton>
                          )}
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetail(r)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                            title="Lihat Detail Hasil Pengujian Lab"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </DnaButton>
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  );
                })
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>
    </div>
  );
}
