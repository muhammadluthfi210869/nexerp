import React from "react";
import { FlaskConical, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
  DnaBadge,
  formatRupiah,
  DnaFilterColumnConfig,
} from "@/components/dna";
import { ArchivedFormula } from "../_types/repository.types";

interface RepositoryTableProps {
  searchQuery: string;
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
  filteredFormulas: ArchivedFormula[];
  onSelectFormula: (formula: ArchivedFormula) => void;
  onVerifyVault: () => void;
}

export function RepositoryTable({
  searchQuery,
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
  filteredFormulas,
  onSelectFormula,
  onVerifyVault,
}: RepositoryTableProps) {
  return (
    <DnaDataTableCard
      count={filteredFormulas.length}
      toolbarProps={{
        searchValue: searchQuery,
        onSearchChange: onSearchChange,
        searchPlaceholder: "Cari kode formula / produk / formulator...",
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
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <DnaTh className="p-3.5 w-12 text-center whitespace-nowrap">#</DnaTh>
              <DnaTh className="p-3.5 w-36 min-w-[130px] whitespace-nowrap">KODE FORMULASI</DnaTh>
              <DnaTh className="p-3.5 min-w-[220px]">NAMA FORMULA PRODUK</DnaTh>
              <DnaTh className="p-3.5 w-32 min-w-[120px] whitespace-nowrap">KATEGORI KOSMETIK</DnaTh>
              <DnaTh className="p-3.5 w-28 min-w-[100px] text-center whitespace-nowrap">REVISI / VERSI</DnaTh>
              <DnaTh className="p-3.5 w-40 min-w-[150px] whitespace-nowrap">FORMULATOR R&D</DnaTh>
              <DnaTh className="p-3.5 w-32 min-w-[120px] text-center whitespace-nowrap">JUMLAH BAHAN BAKU</DnaTh>
              <DnaTh className="p-3.5 w-36 min-w-[130px] text-right whitespace-nowrap">HPP FORMULASI / KG (RP)</DnaTh>
              <DnaTh className="p-3.5 w-32 min-w-[110px] text-center whitespace-nowrap">TARGET NETTO KEMASAN</DnaTh>
              <DnaTh className="p-3.5 w-32 min-w-[110px] text-center whitespace-nowrap">STATUS FORMULA</DnaTh>
              <DnaTh className="p-3.5 text-center w-20 whitespace-nowrap">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredFormulas.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="py-12 text-center text-slate-400">
                  <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada formula arsip yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredFormulas.map((formula, idx) => (
                <DnaTableRow
                  key={formula.id}
                  onClick={() => onSelectFormula(formula)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  {/* 1. # */}
                  <DnaTd className="p-3.5 text-center whitespace-nowrap text-slate-400 font-mono text-xs">
                    {idx + 1}
                  </DnaTd>

                  {/* 2. Kode Formulasi */}
                  <DnaTd className="p-3.5 whitespace-nowrap">
                    <DnaCell.Code value={formula.formulaCode} onClick={() => onSelectFormula(formula)} />
                  </DnaTd>

                  {/* 3. Nama Formula Produk */}
                  <DnaTd className="p-3.5 min-w-[220px]">
                    <span className="font-semibold text-slate-900 text-xs">{formula.name}</span>
                  </DnaTd>

                  {/* 4. Kategori Kosmetik */}
                  <DnaTd className="p-3.5 whitespace-nowrap">
                    <DnaBadge variant="neutral">{formula.category}</DnaBadge>
                  </DnaTd>

                  {/* 5. Revisi / Versi */}
                  <DnaTd className="p-3.5 text-center whitespace-nowrap">
                    <span className="tabular-nums text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200/60">
                      {formula.version}
                    </span>
                  </DnaTd>

                  {/* 6. Formulator R&D */}
                  <DnaTd className="p-3.5 whitespace-nowrap">
                    <DnaCell.Avatar name={formula.pic} />
                  </DnaTd>

                  {/* 7. Jumlah Bahan Baku */}
                  <DnaTd className="p-3.5 text-center whitespace-nowrap">
                    <span className="tabular-nums font-semibold text-slate-700 text-xs">
                      {formula.ingredientCount} Bahan
                    </span>
                  </DnaTd>

                  {/* 8. HPP Formulasi / Kg (Rp) */}
                  <DnaTd className="p-3.5 text-right whitespace-nowrap">
                    <span className="tabular-nums font-bold text-slate-800 text-xs">
                      {formatRupiah(formula.costPerKg)}
                    </span>
                  </DnaTd>

                  {/* 9. Target Netto Kemasan */}
                  <DnaTd className="p-3.5 text-center whitespace-nowrap">
                    <span className="tabular-nums text-xs text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded">
                      {formula.targetNetto}
                    </span>
                  </DnaTd>

                  {/* 10. Status Formula */}
                  <DnaTd className="p-3.5 text-center whitespace-nowrap">
                    <DnaBadge
                      variant={
                        formula.status === "RELEASED"
                          ? "success"
                          : formula.status === "ARCHIVED"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {formula.status === "RELEASED"
                        ? "Rilis CPKB"
                        : formula.status === "ARCHIVED"
                        ? "Arsip Non-Aktif"
                        : "Draft"}
                    </DnaBadge>
                  </DnaTd>

                  {/* 11. Aksi */}
                  <DnaTd className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onSelectFormula(formula)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer"
                      title="Lihat Detail Formula Vault"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
          </DnaTableBody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}
