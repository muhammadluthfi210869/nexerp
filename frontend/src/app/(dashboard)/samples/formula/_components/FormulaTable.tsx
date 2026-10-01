import React from "react";
import { Plus, Trash2, RotateCcw, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaButton,
  DnaBadge,
  formatRupiah,
  DnaFilterColumnConfig,
} from "@/components/dna";
import { FormulaIngredient, FormulaKpiStats, PhaseKey } from "../_types/formula.types";

interface FormulaTableProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedPhaseFilter: string;
  onPhaseFilterChange: (val: string) => void;
  filteredIngredients: FormulaIngredient[];
  stats: FormulaKpiStats;
  batchSizeGram: number;
  isSaving: boolean;
  onOpenAddModal: () => void;
  onUpdatePercentage: (id: string, newPercentage: number) => void;
  onUpdatePhase: (id: string, phase: PhaseKey) => void;
  onRemoveIngredient: (id: string) => void;
  onSaveFormula: () => void;
  onResetDefault: () => void;
}

export function FormulaTable({
  searchQuery,
  onSearchChange,
  selectedPhaseFilter,
  onPhaseFilterChange,
  filteredIngredients,
  stats,
  batchSizeGram,
  isSaving,
  onOpenAddModal,
  onUpdatePercentage,
  onUpdatePhase,
  onRemoveIngredient,
  onSaveFormula,
  onResetDefault,
}: FormulaTableProps) {
  const filterColumns: DnaFilterColumnConfig[] = [
    {
      key: "phase",
      label: "Fase Formulasi",
      type: "select",
      options: ["Semua Fase", "Fase A", "Fase B", "Fase C", "Fase D"],
    },
  ];

  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari kode bahan / INCI / fungsi / fase...",
        filterColumns,
        selectedColumn: "phase",
        onSelectColumn: () => {},
        filterValue: selectedPhaseFilter ? `Fase ${selectedPhaseFilter}` : "Semua Fase",
        onFilterValueChange: (val) =>
          onPhaseFilterChange(val.replace("Fase ", "").replace("Semua Fase", "")),
        actionButton: {
          label: "Tambah Bahan Baku",
          icon: <Plus className="w-4 h-4 mr-1" />,
          onClick: onOpenAddModal,
        },
        extraActions: (
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={onResetDefault}
              title="Reset ke template standar"
            >
              Reset
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Save className="w-3.5 h-3.5 mr-1" />}
              loading={isSaving}
              onClick={onSaveFormula}
              disabled={!stats.isBalanced}
            >
              Simpan Formulasi Lab
            </DnaButton>
          </div>
        ),
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <DnaTh className="p-3.5 w-12 text-center whitespace-nowrap">#</DnaTh>
              <DnaTh className="p-3.5 w-28 text-center whitespace-nowrap">FASE (A/B/C)</DnaTh>
              <DnaTh className="p-3.5 w-36 min-w-[130px] whitespace-nowrap">KODE BAHAN / SKU</DnaTh>
              <DnaTh className="p-3.5 min-w-[220px]">NAMA BAHAN / INCI</DnaTh>
              <DnaTh className="p-3.5 min-w-[180px]">FUNGSI BAHAN</DnaTh>
              <DnaTh className="p-3.5 w-32 min-w-[110px] text-right whitespace-nowrap">PERSENTASE (%)</DnaTh>
              <DnaTh className="p-3.5 w-36 min-w-[120px] text-right whitespace-nowrap">KEBUTUHAN GRAM (BATCH)</DnaTh>
              <DnaTh className="p-3.5 w-36 min-w-[120px] text-right whitespace-nowrap">HARGA SATUAN (RP/KG)</DnaTh>
              <DnaTh className="p-3.5 w-36 min-w-[120px] text-right whitespace-nowrap">SUBTOTAL BIAYA (RP)</DnaTh>
              <DnaTh className="p-3.5 text-center w-16 whitespace-nowrap">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredIngredients.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                  Tidak ada komposisi bahan formulasi yang cocok.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredIngredients.map((item, idx) => (
                <DnaTableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* 1. # */}
                  <DnaTd className="p-3.5 text-center whitespace-nowrap text-slate-400 font-mono text-xs">
                    {idx + 1}
                  </DnaTd>

                  {/* 2. Fase (A/B/C) */}
                  <DnaTd className="p-3.5 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center justify-center font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                        item.phase === "A"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : item.phase === "B"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      Fase {item.phase}
                    </span>
                  </DnaTd>

                  {/* 3. Kode Bahan / SKU */}
                  <DnaTd className="p-3.5 whitespace-nowrap">
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {item.materialCode}
                    </span>
                  </DnaTd>

                  {/* 4. Nama Bahan / INCI */}
                  <DnaTd className="p-3.5 min-w-[220px]">
                    <span className="font-semibold text-slate-900 text-xs">{item.inciName}</span>
                  </DnaTd>

                  {/* 5. Fungsi Bahan */}
                  <DnaTd className="p-3.5 min-w-[180px]">
                    <span className="text-xs text-slate-600">{item.functionName}</span>
                  </DnaTd>

                  {/* 6. Persentase (%) */}
                  <DnaTd className="p-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={item.percentage}
                        onChange={(e) => onUpdatePercentage(item.id, parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-right font-bold text-slate-900 bg-white border border-slate-200 rounded text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-slate-400 font-bold text-xs">%</span>
                    </div>
                  </DnaTd>

                  {/* 7. Kebutuhan Gram (Batch) */}
                  <DnaTd className="p-3.5 text-right whitespace-nowrap">
                    <span className="tabular-nums font-semibold text-slate-800 text-xs">
                      {(item.weightGram || 0).toFixed(2)} g
                    </span>
                  </DnaTd>

                  {/* 8. Harga Satuan (Rp/Kg) */}
                  <DnaTd className="p-3.5 text-right whitespace-nowrap">
                    <span className="tabular-nums text-slate-600 text-xs">
                      {formatRupiah(item.unitPrice)}
                    </span>
                  </DnaTd>

                  {/* 9. Subtotal Biaya (Rp) */}
                  <DnaTd className="p-3.5 text-right whitespace-nowrap">
                    <span className="tabular-nums font-bold text-slate-900 text-xs">
                      {formatRupiah(item.subtotalCost || 0)}
                    </span>
                  </DnaTd>

                  {/* 10. Aksi */}
                  <DnaTd className="p-3.5 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onRemoveIngredient(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer"
                      title="Hapus Bahan Baku"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
          </DnaTableBody>
        </DnaTable>
      </div>

      {/* Auto-Calculate Summary Banner Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          {stats.isBalanced ? (
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Komposisi Seimbang: {stats.totalPercentage.toFixed(2)}% (Formula Valid)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-rose-700 font-bold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Total Komposisi: {stats.totalPercentage.toFixed(2)}% (Selisih {(100 - stats.totalPercentage).toFixed(2)}% dari 100.00%)
              </span>
            </div>
          )}
          <span className="text-slate-500">
            Total Batch: <strong className="text-slate-800">{batchSizeGram.toLocaleString()} Gram</strong>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total HPP Formulasi / Kg</span>
            <span className="text-base font-bold text-purple-700 tabular-nums">
              {formatRupiah(stats.costPerKg)} <span className="text-xs font-normal text-slate-500">/ Kg</span>
            </span>
          </div>
        </div>
      </div>
    </DnaDataTableCard>
  );
}
